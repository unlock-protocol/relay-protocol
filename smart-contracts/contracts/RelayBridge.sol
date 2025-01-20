// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IHyperlaneMailbox} from "./interfaces/IHyperlaneMailbox.sol";
import {StandardHookMetadata} from "./utils/StandardHookMetadata.sol";
// import "hardhat/console.sol";

error BridgingFailed(
  address proxyBridge,
  address sender,
  uint32 poolChainId,
  address pool,
  address asset,
  uint256 amount,
  bytes data
);

interface IRelayBridge {
  function bridge(
    uint256 amount,
    address recipient,
    uint32 poolChainId,
    address pool
  ) external payable returns (uint256 nonce);
}

contract RelayBridge is IRelayBridge {
  uint256 public constant IGP_GAS_LIMIT = 300_000;

  uint256 public transferNonce;
  address public asset;
  address public proxyBridge;
  address public hyperlaneMailbox;

  event BridgeInitiated(
    uint256 indexed nonce,
    address sender,
    address recipient,
    address asset,
    uint256 amount,
    uint32 poolChainId,
    address pool
  );

  constructor(address _asset, address _proxyBridge, address _hyperlaneMailbox) {
    transferNonce = 0;
    asset = _asset;
    proxyBridge = _proxyBridge;
    hyperlaneMailbox = _hyperlaneMailbox;
  }

  function bridge(
    uint256 amount,
    address recipient,
    uint32 poolChainId,
    address pool
  ) external payable returns (uint256 nonce) {
    // Associate the withdrawal to a unique id
    nonce = transferNonce++;

    // Encode the data for the cross-chain message
    // No need to pass the asset since the pool is asset-specific
    bytes memory data = abi.encode(nonce, recipient, amount);

    // Get the fee for the cross-chain message
    uint256 hyperlaneFee = IHyperlaneMailbox(hyperlaneMailbox).quoteDispatch(
      poolChainId,
      bytes32(uint256(uint160(pool))),
      data,
      StandardHookMetadata.overrideGasLimit(IGP_GAS_LIMIT)
    );

    // Issue transfer on the bridge
    (bool success, ) = proxyBridge.delegatecall(
      abi.encodeWithSignature(
        "bridge(address,uint32,address,address,uint256,bytes)",
        msg.sender,
        poolChainId,
        pool,
        asset,
        amount,
        data
      )
    );
    if (!success)
      revert BridgingFailed(
        proxyBridge,
        msg.sender,
        poolChainId,
        pool,
        asset,
        amount,
        data
      );

    // Send the message, with the right fee
    IHyperlaneMailbox(hyperlaneMailbox).dispatch{value: hyperlaneFee}(
      poolChainId,
      bytes32(uint256(uint160(pool))),
      data,
      StandardHookMetadata.overrideGasLimit(IGP_GAS_LIMIT)
    );

    emit BridgeInitiated(
      nonce,
      msg.sender,
      recipient,
      asset,
      amount,
      poolChainId,
      pool
    );
  }
}
