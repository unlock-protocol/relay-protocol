import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BridgeProxy {
  // errors
  error TOKEN_NOT_BRIDGED(address token);
  error NOT_AUTHORIZED(address user, uint256 chainId);
  error BRIDGE_NOT_IMPLEMENTED();
  error TRANSFER_FAILED(uint256 amount);

  uint256 public immutable RELAY_POOL_CHAIN_ID;
  address public immutable RELAY_POOL;
  address public immutable L1_BRIDGE_PROXY;

  constructor(
    uint256 replayPoolChainId,
    address relayPool,
    address l1BridgeProxy
  ) {
    RELAY_POOL_CHAIN_ID = replayPoolChainId;
    RELAY_POOL = relayPool;
    L1_BRIDGE_PROXY = l1BridgeProxy;
  }

  // This should be called as delegateCall from the Bridging contract
  // We use `delegateCall` so that the the user can approve the Bridge contract
  // and not worry/care about The proxyBridge contract.
  function bridge(
    address,
    address,
    uint256,
    bytes calldata
  ) external payable virtual {
    revert BRIDGE_NOT_IMPLEMENTED();
  }

  // This should be called by Pool contract as a way to claim funds received from
  // the bridge Implementations MUST use `onlyRelayPool` modifier to make sure only
  // the RelayPool can call this function.
  // "Finalization" of the bridge can be triggered by anyone (and should probably
  // have been triggered before calling this.)
  function claim(
    address currency
  ) external onlyRelayPool returns (uint256 balance) {
    if (currency == address(0)) {
      balance = address(this).balance;
      (bool success, ) = RELAY_POOL.call{value: balance}("");
      if (!success) {
        revert TRANSFER_FAILED(balance);
      }
    } else {
      balance = IERC20(currency).balanceOf(address(this));
      IERC20(currency).transfer(RELAY_POOL, balance);
    }
  }

  // modifier to make sure only the pool can call the claim function!
  modifier onlyRelayPool() {
    if (msg.sender != RELAY_POOL && block.chainid != RELAY_POOL_CHAIN_ID) {
      revert NOT_AUTHORIZED(msg.sender, block.chainid);
    }
    _;
  }
}
