// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract BridgeProxy {
  // errors
  error TOKEN_NOT_BRIDGED(address token);

  // This should be called as delegateCall from the Bridging contract
  function bridge(
    address sender,
    uint32 destinationChainId, // Should always be 1
    address recipient,
    address currency,
    uint256 amount,
    bytes calldata data
  ) external payable virtual;

  // This should be called as delegateCall from the Pool contract as a way to claim funds
  function claim(
    address currency,
    bytes calldata bridgeParams
  ) external virtual returns (uint256);
}
