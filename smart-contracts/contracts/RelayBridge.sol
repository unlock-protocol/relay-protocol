// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IHyperlaneMailbox} from "./interfaces/IHyperlaneMailbox.sol";
import {StandardHookMetadata} from "./utils/StandardHookMetadata.sol";
import {BridgeProxy} from "./BridgeProxy/BridgeProxy.sol";

error BridgingFailed(
  BridgeProxy bridgeProxy,
  address sender,
  address asset,
  uint256 amount,
  bytes data
);

interface IRelayBridge {
  function bridge(
    uint256 amount,
    address recipient
  ) external payable returns (uint256 nonce);
}

contract RelayBridge is IRelayBridge {
  uint256 public constant IGP_GAS_LIMIT = 300_000;

  uint256 public transferNonce;
  address public asset;
  BridgeProxy public bridgeProxy;
  address public hyperlaneMailbox;

  event BridgeInitiated(
    uint256 indexed nonce,
    address indexed sender,
    address recipient,
    address asset,
    uint256 amount,
    BridgeProxy bridgeProxy
  );

  constructor(
    address _asset,
    BridgeProxy _bridgeProxy,
    address _hyperlaneMailbox
  ) {
    transferNonce = 0;
    asset = _asset;
    bridgeProxy = _bridgeProxy;
    hyperlaneMailbox = _hyperlaneMailbox;
  }

  function bridge(
    uint256 amount,
    address recipient
  ) external payable returns (uint256 nonce) {
    // Associate the withdrawal to a unique id
    nonce = transferNonce++;

    // Encode the data for the cross-chain message
    // No need to pass the asset since the pool is asset-specific
    bytes memory data = abi.encode(nonce, recipient, amount, block.timestamp);

    uint32 poolChainId = uint32(bridgeProxy.RELAY_POOL_CHAIN_ID());

    bytes32 poolId = bytes32(uint256(uint160(bridgeProxy.RELAY_POOL())));

    // Get the fee for the cross-chain message
    uint256 hyperlaneFee = IHyperlaneMailbox(hyperlaneMailbox).quoteDispatch(
      poolChainId,
      poolId,
      data,
      StandardHookMetadata.overrideGasLimit(IGP_GAS_LIMIT)
    );

    // Issue transfer on the bridge
    (bool success, ) = address(bridgeProxy).delegatecall(
      abi.encodeWithSignature(
        "bridge(address,address,uint256,bytes)",
        msg.sender,
        asset,
        amount,
        data
      )
    );
    if (!success)
      revert BridgingFailed(bridgeProxy, msg.sender, asset, amount, data);

    // Send the message, with the right fee
    IHyperlaneMailbox(hyperlaneMailbox).dispatch{value: hyperlaneFee}(
      poolChainId,
      poolId,
      data,
      StandardHookMetadata.overrideGasLimit(IGP_GAS_LIMIT)
    );

    emit BridgeInitiated(
      nonce,
      msg.sender,
      recipient,
      asset,
      amount,
      bridgeProxy
    );
  }
}
