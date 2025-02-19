// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract BridgeProxy {
  // errors
  error TOKEN_NOT_BRIDGED(address token);
  error NOT_AUTHORIZED(address user, uint256 chainId);

  address public immutable RELAY_POOL_CHAIN_ID;
  address public immutable RELAY_POOL;

  constructor(uint replayPoolChainId, address relayPool) {
    RELAY_POOL_CHAIN_ID = replayPoolChainId;
    RELAY_POOL = relayPool;
  }

  // This should be called as delegateCall from the Bridging contract
  function bridge(
    address sender,
    address currency,
    uint256 amount,
    bytes calldata data
  ) external payable virtual;

  // This should be called by Pool contract as a way to claim funds received from the bridge
  function claim() external virtual returns (uint256);

  // modifier to make sure only the pool can call the claim function!
  modifier onlyRelayPool() {
    if (msg.sender != RELAY_POOL && block.chainid != RELAY_POOL_CHAIN_ID) {
      revert NOT_AUTHORIZED(msg.sender, block.chainid);
    }
    _;
  }
}
