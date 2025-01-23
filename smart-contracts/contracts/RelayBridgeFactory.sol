// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {RelayBridge} from "./RelayBridge.sol";

contract RelayBridgeFactory {
  address public hyperlaneMailbox;

  mapping(address => address[]) public bridgesByAsset; // Keeping track of bridges by asset.

  event BridgeDeployed(
    address bridge,
    address indexed asset,
    address indexed proxyBridge
  );

  constructor(address hMailbox) {
    hyperlaneMailbox = hMailbox;
  }

  function deployBridge(
    address asset,
    address proxyBridge
  ) public returns (address) {
    RelayBridge bridge = new RelayBridge(asset, proxyBridge, hyperlaneMailbox);
    bridgesByAsset[asset].push(address(bridge));
    emit BridgeDeployed(address(bridge), asset, proxyBridge);
    return address(bridge);
  }
}
