// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC4626} from "solmate/src/tokens/ERC4626.sol";
import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {TypeCasts} from "./utils/TypeCasts.sol";

struct OriginSettings {
  uint256 maxDebt;
  uint256 outstandingDebt;
  address proxyBridge;
}

struct OriginParam {
  uint32 chainId;
  address bridge;
  address proxyBridge;
  uint256 maxDebt;
}

error UnauthorizedCaller(address sender);
error UnauthorizedOrigin(uint32 chainId, address bridge);
error MessageAlreadyProcessed(uint32 chainId, address bridge, uint256 nonce);
error TooMuchDebtFromOrigin(
  uint32 chainId,
  address bridge,
  uint256 maxDebt,
  uint256 nonce,
  address recipient,
  uint256 amount
);
error ClaimingFailed(
  uint32 chainId,
  address bridge,
  address proxyBridge,
  bytes claimParams
);
error NotAWethPool();

contract RelayPool is ERC4626, Ownable {
  // The address of the Hyperlane mailbox
  address public immutable HYPERLANE_MAILBOX;

  // The address of the weth contract (used for native pools)
  address public immutable WETH;

  // Keeping track of the outstanding debt for ERC4626 computations
  uint256 public outstandingDebt = 0;

  // Mapping of origins to their settings
  mapping(uint32 => mapping(address => OriginSettings))
    public authorizedOrigins;

  // Mapping of messages by origin
  mapping(uint32 => mapping(address => mapping(uint256 => bytes)))
    public messages;

  // The address of the yield pool where funds are deposited
  address public yieldPool;

  // The protocol fee in basis points
  uint8 public bridgeFee;

  event LoanEmitted(
    uint256 indexed nonce,
    address indexed recipient,
    ERC20 asset,
    uint256 amount,
    uint32 bridgeChainId,
    address indexed bridge
  );

  event BridgeCompleted(
    uint32 chainId,
    address indexed bridge,
    uint256 amount,
    bytes claimParams
  );

  event OutstandingDebtChanged(uint256 oldDebt, uint256 newDebt);

  event AssetsDepositedIntoYieldPool(uint256 amount, address yieldPool);
  event AssetsWithdrawnFromYieldPool(uint256 amount, address yieldPool);

  event YieldPoolChanged(address oldPool, address newPool);

  event OriginAdded(OriginParam origin);
  event OriginRemoved(
    uint32 chainId,
    address bridge,
    uint256 maxDebt,
    uint256 outstandingDebt,
    address proxyBridge
  );
  event BridgeFeeSet(uint8 previousFee, uint8 newFee);

  // Warning: the owner of the pool should always be a timelock address with a significant delay to reduce the risk of stolen funds
  constructor(
    address hyperlaneMailbox,
    ERC20 asset,
    string memory name,
    string memory symbol,
    OriginParam[] memory origins,
    address thirdPartyPool,
    address wrappedEth,
    uint8 feeBasisPoints,
    address curator
  ) ERC4626(asset, name, symbol) Ownable(msg.sender) {
    // TODO: can we verify that the asset is an ERC20?

    // Set the Hyperlane mailbox
    HYPERLANE_MAILBOX = hyperlaneMailbox;

    // Set the authorized origins
    for (uint256 i = 0; i < origins.length; i++) {
      addOrigin(origins[i]);
    }

    // set the yieldPool
    yieldPool = thirdPartyPool;

    // set weth
    WETH = wrappedEth;

    // set protocol fee
    bridgeFee = feeBasisPoints;

    // Change the owner to the curator
    transferOwnership(curator);
  }

  function updateYieldPool(address newPool) public onlyOwner {
    address oldPool = yieldPool;
    uint256 sharesOfOldPool = ERC20(yieldPool).balanceOf(address(this));
    // Redeem all the shares from the old pool
    uint withdrawnAssets = ERC4626(yieldPool).redeem(
      sharesOfOldPool,
      address(this),
      address(this)
    );
    yieldPool = newPool;
    // Deposit all assets into the new pool
    depositAssetsInYieldPool(withdrawnAssets);
    emit YieldPoolChanged(oldPool, newPool);
  }

  function addOrigin(OriginParam memory origin) public onlyOwner {
    authorizedOrigins[origin.chainId][origin.bridge] = OriginSettings({
      maxDebt: origin.maxDebt,
      outstandingDebt: 0,
      proxyBridge: origin.proxyBridge
    });
    emit OriginAdded(origin);
  }

  function removeOrigin(uint32 chainId, address bridge) public onlyOwner {
    OriginSettings memory origin = authorizedOrigins[chainId][bridge];
    delete authorizedOrigins[chainId][bridge];
    emit OriginRemoved(
      chainId,
      bridge,
      origin.maxDebt,
      origin.outstandingDebt,
      origin.proxyBridge
    );
  }

  function setBridgeFee(uint8 feeBasisPoints) public onlyOwner {
    uint8 oldFee = bridgeFee;
    bridgeFee = feeBasisPoints;
    emit BridgeFeeSet(oldFee, feeBasisPoints);
  }

  function increaseOutStandingDebt(uint256 amount) internal {
    uint256 currentOutstandingDebt = outstandingDebt;
    outstandingDebt += amount;
    emit OutstandingDebtChanged(currentOutstandingDebt, outstandingDebt);
  }

  function decreaseOutStandingDebt(uint256 amount) internal {
    uint256 currentOutstandingDebt = outstandingDebt;
    outstandingDebt -= amount;
    emit OutstandingDebtChanged(currentOutstandingDebt, outstandingDebt);
  }

  // We cap the maxDeposit of any receiver to the maxDeposit of the yield pool for us
  function maxDeposit(
    address /* receiver */
  ) public view override returns (uint256 maxAssets) {
    return ERC4626(yieldPool).maxDeposit(address(this));
  }

  // We cap the maxWithdraw of any owner to the maxWithdraw of the yield pool for us
  function maxWithdraw(
    address owner
  ) public view override returns (uint256 maxAssets) {
    return convertToAssets(this.balanceOf(owner));
  }

  // We cap the maxMint of any receiver to the number of our shares corresponding to the
  // maxDeposit of the yield pool for us
  function maxMint(
    address receiver
  ) public view override returns (uint256 maxShares) {
    uint256 maxDepositInYieldPool = maxDeposit(receiver);
    return ERC4626.previewDeposit(maxDepositInYieldPool);
  }

  // We cap the maxRedeem of any owner to the maxRedeem of the yield pool for us
  function maxRedeem(
    address owner
  ) public view override returns (uint256 maxAssets) {
    uint256 maxWithdrawInYieldPool = maxWithdraw(owner);
    return ERC4626.previewWithdraw(maxWithdrawInYieldPool);
  }

  // This function returns the total assets "controlled" by the pool
  // This is the sum of
  // - the assets that would be resulting from withdrawing all the shares held by this pool into
  //   the yield pool
  // - the assets "in transit" to the pool (i.e. the outstanding debt)
  // WARNING: a previous version of this function took the token balance into account.
  //          This creates a vulnerability where a 3rd party can inflate the share price by
  //          depositing tokens into the pool and then use these tokens as collateral.
  //          See https://mudit.blog/cream-hack-analysis/
  function totalAssets() public view override returns (uint256) {
    uint256 balanceOfYieldPoolTokens = ERC20(yieldPool).balanceOf(
      address(this)
    );
    uint256 yieldPoolBalance = ERC4626(yieldPool).previewRedeem(
      balanceOfYieldPoolTokens
    );
    return yieldPoolBalance + outstandingDebt;
  }

  // Helper function
  // We deposit all the assets we own to the yield pool.
  // This function can also be called by anyone if the pool owns
  // tokens that are not in the yield pool.

  function depositAssetsInYieldPool(uint amount) internal {
    ERC20(asset).approve(yieldPool, amount);
    ERC4626(yieldPool).deposit(amount, address(this));
    emit AssetsDepositedIntoYieldPool(amount, yieldPool);
  }

  // Helper function
  // We withdraw only the required amount.
  // This function is internal for obvious reasons!
  function withdrawAssetsFromYieldPool(
    uint256 amount,
    address recipient
  ) internal {
    ERC4626(yieldPool).withdraw(amount, recipient, address(this));
    emit AssetsWithdrawnFromYieldPool(amount, yieldPool);
  }

  // Function called by Hyperlane
  // We need to instantly send funds to the user
  // BUT we need to make sure we do not change the underlying balance of assets,
  // because the funds will eventually arrive.
  function handle(
    uint32 chainId,
    bytes32 bridgeAddress,
    bytes calldata message
  ) external payable {
    // Only `HYPERLANE_MAILBOX` is authorized to call this method
    if (msg.sender != HYPERLANE_MAILBOX) {
      revert UnauthorizedCaller(msg.sender);
    }

    // convert bytes32 to address
    address bridge = TypeCasts.bytes32ToAddress(bridgeAddress);

    // Check if the origin is authorized
    OriginSettings storage origin = authorizedOrigins[chainId][bridge];
    if (origin.maxDebt == 0) {
      revert UnauthorizedOrigin(chainId, bridge);
    }

    // Parse the data received from the sender chain
    (uint256 nonce, address recipient, uint256 amount) = abi.decode(
      message,
      (uint256, address, uint256)
    );

    // Check if message was already processed
    if (messages[chainId][bridge][nonce].length > 0) {
      revert MessageAlreadyProcessed(chainId, bridge, nonce);
    }
    // Mark as processed if not
    messages[chainId][bridge][nonce] = message;

    // Check if origin settings are respected
    if (origin.outstandingDebt + amount > origin.maxDebt) {
      revert TooMuchDebtFromOrigin(
        chainId,
        bridge,
        origin.maxDebt,
        nonce,
        recipient,
        amount
      );
    }

    origin.outstandingDebt += amount;
    increaseOutStandingDebt(amount);

    // Pull funds from the yield pool, and send them to the recipient
    sendFunds(amount, recipient);

    // TODO: handle fees!
    // TODO: handle insufficient funds?

    emit LoanEmitted(nonce, recipient, asset, amount, chainId, bridge);
  }

  // This function is called externally to claim funds from a bridge.
  // The funds are immediately added to the yieldPool
  function claim(
    uint32 chainId,
    address bridge,
    bytes calldata claimParams
  ) external {
    OriginSettings storage origin = authorizedOrigins[chainId][bridge];
    if (origin.maxDebt == 0) {
      revert UnauthorizedOrigin(chainId, bridge);
    }

    (bool success, bytes memory result) = origin.proxyBridge.delegatecall(
      abi.encodeWithSignature("claim(address,bytes)", asset, claimParams)
    );

    if (!success) {
      revert ClaimingFailed(chainId, bridge, origin.proxyBridge, claimParams);
    }

    // Decode the result
    uint256 amount = abi.decode(result, (uint256));

    // We should have received funds
    // Update the outstanding debts (both for the origin and the pool total)
    origin.outstandingDebt -= amount;
    decreaseOutStandingDebt(amount);
    // and we should deposit these funds into the yield pool
    depositAssetsInYieldPool(amount);

    // TODO: include more details about the origin of the funds
    emit BridgeCompleted(chainId, bridge, amount, claimParams);
  }

  // Internal function to send funds to a recipient,
  // based on whether this is an ERC20 or native ETH.
  function sendFunds(uint256 amount, address recipient) internal {
    if (address(asset) == WETH) {
      withdrawAssetsFromYieldPool(amount, address(this));
      IWETH(WETH).withdraw(amount);
      payable(recipient).transfer(amount);
    } else {
      withdrawAssetsFromYieldPool(amount, recipient);
    }
  }

  function beforeWithdraw(
    uint256 assets,
    uint256 /* shares */
  ) internal override {
    // We need to withdraw the assets from the yield pool
    withdrawAssetsFromYieldPool(assets, address(this));
  }

  function afterDeposit(
    uint256 assets,
    uint256 /* shares */
  ) internal override {
    // We need to deposit the assets into the yield pool
    depositAssetsInYieldPool(assets);
  }

  receive() external payable {
    if (address(asset) != WETH) {
      revert NotAWethPool();
    }
    if (msg.sender != WETH) {
      IWETH(WETH).deposit{value: address(this).balance}();
    }
  }
}
