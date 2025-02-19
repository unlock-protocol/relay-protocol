// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC4626} from "solmate/src/tokens/ERC4626.sol";
import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {ITokenSwap} from "./interfaces/ITokenSwap.sol";
import {TypeCasts} from "./utils/TypeCasts.sol";
import {HyperlaneMessage} from "./Types.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {BridgeProxy} from "./BridgeProxy/BridgeProxy.sol";

struct OriginSettings {
  address curator;
  uint256 maxDebt;
  uint256 outstandingDebt;
  address proxyBridge;
  uint8 bridgeFee; // basis points
  uint32 coolDown; // in seconds
}

struct OriginParam {
  address curator;
  uint32 chainId;
  address bridge;
  address proxyBridge;
  uint256 maxDebt;
  uint8 bridgeFee; // basis points
  uint32 coolDown; // in seconds
}

error UnauthorizedCaller(address sender);
error UnauthorizedSwap(address token);
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
error MessageTooRecent(
  uint32 chainId,
  address bridge,
  uint256 nonce,
  uint256 timestamp,
  uint32 coolDown
);

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

  // unswap wrapper contract
  address public tokenSwapAddress;

  // Keeping track of the total fees collected
  uint256 public pendingBridgeFees = 0;

  // All incoming assets are streamed (even though they are instantly deposited in the yield pool)
  uint256 public totalAssetsToStream = 0;
  uint256 public lastAssetsCollectedAt = 0;
  uint256 public endOfStream = block.timestamp;
  uint256 public streamingPeriod = 7 days;

  event LoanEmitted(
    uint256 indexed nonce,
    address indexed recipient,
    ERC20 asset,
    uint256 amount,
    OriginSettings origin,
    uint256 fees
  );

  event BridgeCompleted(
    uint32 chainId,
    address indexed bridge,
    uint256 amount,
    uint256 fees
  );

  event OutstandingDebtChanged(
    uint256 oldDebt,
    uint256 newDebt,
    OriginSettings origin,
    uint256 oldOriginDebt,
    uint256 newOriginDebt
  );

  event AssetsDepositedIntoYieldPool(uint256 amount, address yieldPool);
  event AssetsWithdrawnFromYieldPool(uint256 amount, address yieldPool);
  event TokenSwapChanged(address prevAddress, address newAddress);

  event YieldPoolChanged(address oldPool, address newPool);
  event StreamingPeriodChanged(uint256 oldPeriod, uint256 newPeriod);

  event OriginAdded(OriginParam origin);
  event OriginDisabled(
    uint32 chainId,
    address bridge,
    uint256 maxDebt,
    uint256 outstandingDebt,
    address proxyBridge
  );

  // Warning: the owner of the pool should always be a timelock address with a significant delay to reduce the risk of stolen funds
  constructor(
    address hyperlaneMailbox,
    ERC20 asset,
    string memory name,
    string memory symbol,
    OriginParam[] memory origins,
    address thirdPartyPool,
    address wrappedEth,
    address curator
  ) ERC4626(asset, name, symbol) Ownable(msg.sender) {
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

    // Change the owner to the curator
    transferOwnership(curator);
  }

  function updateStreamingPeriod(uint256 newPeriod) public onlyOwner {
    updateStreamedAssets();
    uint256 oldPeriod = streamingPeriod;
    streamingPeriod = newPeriod;
    emit StreamingPeriodChanged(oldPeriod, newPeriod);
  }

  function updateYieldPool(address newPool) public onlyOwner {
    address oldPool = yieldPool;
    uint256 sharesOfOldPool = ERC20(yieldPool).balanceOf(address(this));
    // Redeem all the shares from the old pool
    uint256 withdrawnAssets = ERC4626(yieldPool).redeem(
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
      curator: origin.curator, // We can't use msg.sender here, because we recommend msg.sender to be a timelock and this address should be able to disable an origin quickly!
      maxDebt: origin.maxDebt,
      outstandingDebt: 0,
      proxyBridge: origin.proxyBridge,
      bridgeFee: origin.bridgeFee,
      coolDown: origin.coolDown
    });
    emit OriginAdded(origin);
  }

  // We cannot completely remove an origin, because the funds might still be in transit...
  // But we can "block" new funds from being sent
  function disableOrigin(uint32 chainId, address bridge) public {
    OriginSettings memory origin = authorizedOrigins[chainId][bridge];
    if (msg.sender != origin.curator) {
      revert UnauthorizedCaller(msg.sender);
    }
    authorizedOrigins[chainId][bridge].maxDebt = 0;
    emit OriginDisabled(
      chainId,
      bridge,
      origin.maxDebt,
      origin.outstandingDebt,
      origin.proxyBridge
    );
  }

  function increaseOutStandingDebt(
    uint256 amount,
    OriginSettings storage origin
  ) internal {
    uint256 currentOriginOutstandingDebt = origin.outstandingDebt;
    origin.outstandingDebt += amount;
    uint256 currentOutstandingDebt = outstandingDebt;
    outstandingDebt += amount;
    emit OutstandingDebtChanged(
      currentOutstandingDebt,
      outstandingDebt,
      origin,
      currentOriginOutstandingDebt,
      origin.outstandingDebt
    );
  }

  function decreaseOutStandingDebt(
    uint256 amount,
    OriginSettings storage origin
  ) internal {
    uint256 currentOriginOutstandingDebt = origin.outstandingDebt;
    origin.outstandingDebt -= amount;
    uint256 currentOutstandingDebt = outstandingDebt;
    outstandingDebt -= amount;
    emit OutstandingDebtChanged(
      currentOutstandingDebt,
      outstandingDebt,
      origin,
      currentOriginOutstandingDebt,
      origin.outstandingDebt
    );
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
  // - the bridging fees that have accrued so far (streaming)
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
    // Pending bridge fees are still in the yield pool!
    // So we need to extract them from this pool's asset until
    // The bridge is claimed!
    return
      yieldPoolBalance +
      outstandingDebt -
      pendingBridgeFees -
      remainsToStream();
  }

  // Helper function
  // We deposit assets to the yield pool.
  // This function is internal
  // Note: a previous version used the full balance of assets.
  //       This creates a vulnerability where a 3rd party can inflate
  //       the share price and use that to capture the value created.
  function depositAssetsInYieldPool(uint256 amount) internal {
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
    bytes calldata data
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
    HyperlaneMessage memory message = abi.decode(data, (HyperlaneMessage));

    // if the message is too recent, we reject it
    if (block.timestamp - message.timestamp < origin.coolDown) {
      revert MessageTooRecent(
        chainId,
        bridge,
        message.nonce,
        message.timestamp,
        origin.coolDown
      );
    }

    // Check if message was already processed
    if (messages[chainId][bridge][message.nonce].length > 0) {
      revert MessageAlreadyProcessed(chainId, bridge, message.nonce);
    }
    // Mark as processed if not
    messages[chainId][bridge][message.nonce] = data;

    uint256 feeAmount = (message.amount * origin.bridgeFee) / 10000;
    pendingBridgeFees += feeAmount;

    // Check if origin settings are respected
    // We look at the full amount, because feed are considered debt
    // (they are owed to the pool)
    if (origin.outstandingDebt + message.amount > origin.maxDebt) {
      revert TooMuchDebtFromOrigin(
        chainId,
        bridge,
        origin.maxDebt,
        message.nonce,
        message.recipient,
        message.amount
      );
    }
    increaseOutStandingDebt(message.amount, origin);

    // We only send the amount net of fees
    sendFunds(message.amount - feeAmount, message.recipient);

    emit LoanEmitted(
      message.nonce,
      message.recipient,
      asset,
      message.amount,
      origin,
      feeAmount
    );
  }

  // Compute the streaming fees
  // If the last fee collection was more than 7 days ago, we have nothing left to stream
  // Otherwise, we return the time-based pro-rata of what remains to stream.
  function remainsToStream() internal view returns (uint256) {
    if (block.timestamp > endOfStream) {
      return 0; // Nothing left to stream
    } else {
      return
        totalAssetsToStream - // total assets to stream
        (totalAssetsToStream * (block.timestamp - lastAssetsCollectedAt)) /
        (endOfStream - lastAssetsCollectedAt); // already streamed
    }
  }

  // Updates the streamed fees and returns the new value
  function updateStreamedAssets() public returns (uint256) {
    totalAssetsToStream = remainsToStream();
    lastAssetsCollectedAt = block.timestamp;
    return totalAssetsToStream;
  }

  // Internal function to add assets to be accounted in a streaming fashgion
  function addToStreamingAssets(uint256 amount) internal returns (uint256) {
    updateStreamedAssets();
    // We ajdust the end of the stream based on the new amount
    uint amountLeft = remainsToStream();
    uint timeLeft = Math.max(endOfStream, block.timestamp) - block.timestamp;
    uint weightedStreamingPeriod = (amountLeft *
      timeLeft +
      amount *
      streamingPeriod) / (amountLeft + amount);
    endOfStream = block.timestamp + weightedStreamingPeriod;
    return totalAssetsToStream += amount;
  }

  // This function is called externally to claim funds from a bridge.
  // The funds are immediately added to the yieldPool
  // TODO: handle cases where the origin might have been removed/changed (fees, etc.)
  function claim(uint32 chainId, address bridge) external {
    OriginSettings storage origin = authorizedOrigins[chainId][bridge];
    if (origin.proxyBridge == address(0)) {
      revert UnauthorizedOrigin(chainId, bridge);
    }

    // We need to claim the funds from the bridge
    uint amount = BridgeProxy(origin.proxyBridge).claim(
      address(asset) == WETH ? address(0) : address(asset)
    );

    // We should have received funds
    decreaseOutStandingDebt(amount, origin);
    // and we should deposit these funds into the yield pool
    depositAssetsInYieldPool(amount);

    // The amount is the amount that was loaned + the fees
    // TODO: what happens if the bridgeFee was changed?
    uint256 feeAmount = (amount * origin.bridgeFee) / 10000;
    pendingBridgeFees -= feeAmount;
    // We need to account for it in a streaming fashion
    addToStreamingAssets(feeAmount);

    emit BridgeCompleted(chainId, bridge, amount, feeAmount);
  }

  // Internal function to send funds to a recipient,
  // based on whether this is an ERC20 or native ETH.
  function sendFunds(uint256 amount, address recipient) internal {
    if (address(asset) == WETH) {
      withdrawAssetsFromYieldPool(amount, address(this));
      IWETH(WETH).withdraw(amount);
      (bool s, ) = recipient.call{value: amount}("");
      require(s);
    } else {
      withdrawAssetsFromYieldPool(amount, recipient);
    }
  }

  /**
   * Set the Swap and Deposit contract address
   */
  function setTokenSwap(address _tokenSwapAddress) external onlyOwner {
    address prevTokenSwapAddress = tokenSwapAddress;
    tokenSwapAddress = _tokenSwapAddress;
    emit TokenSwapChanged(prevTokenSwapAddress, tokenSwapAddress);
  }

  function swapAndDeposit(
    address token,
    uint256 amount,
    uint24 uniswapWethPoolFeeToken,
    uint24 uniswapWethPoolFeeAsset
  ) public onlyOwner {
    if (token == address(asset)) {
      revert UnauthorizedSwap(token);
    }

    ERC20(token).transfer(tokenSwapAddress, amount);
    ITokenSwap(tokenSwapAddress).swap(
      token,
      uniswapWethPoolFeeToken,
      uniswapWethPoolFeeAsset
    );
    collectNonDepositedAssets();
  }

  // This function is called by anyone to collect assets and start streaming them
  // to avoid timely attacks.
  function collectNonDepositedAssets() public {
    uint256 balance = ERC20(asset).balanceOf(address(this));
    if (balance > 0) {
      depositAssetsInYieldPool(balance);
      addToStreamingAssets(balance);
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
