// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BridgeProxy} from "./BridgeProxy.sol";
import {IL1SharedBridge} from "../interfaces/zksync/IL1SharedBridge.sol";
import {IL2SharedBridge} from "../interfaces/zksync/IL2SharedBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// docs
// https://developers.circle.com/stablecoins/message-format
contract ZkSyncBridgeProxy is BridgeProxy {
  IL2SharedBridge public immutable L2_SHARED_BRIDGE;
  IL1SharedBridge public immutable L1_SHARED_BRIDGE;

  constructor(address l2SharedBridge, address l1SharedBridge) BridgeProxy() {
    L2_SHARED_BRIDGE = IL2SharedBridge(l2SharedBridge);
    L1_SHARED_BRIDGE = IL1SharedBridge(l1SharedBridge);
  }

  function bridge(
    address sender,
    uint32 /*destinationChainId*/,
    address recipient,
    address currency,
    uint256 amount,
    bytes calldata /*data*/
  ) external payable override {
    if (currency != address(0)) {
      // Take the ERC20 tokens from the sender
      IERC20(currency).transferFrom(sender, address(this), amount);
    }

    // withdraw to L1
    L2_SHARED_BRIDGE.withdraw(recipient, currency, amount);
  }

  struct BridgeParams {
    uint256 chainId;
    uint256 l2BatchNumber;
    uint256 l2MessageIndex;
    uint16 l2TxNumberInBatch;
    bytes message;
    bytes32[] merkleProof;
  }

  function claim(
    address, // currency
    bytes calldata bridgeParams
  ) external override returns (uint256) {
    // unpack args using assembly so we can keep it
    // as bytes 'calldata' to later decode the data
    // to finalize transfer in the outbox contract
    BridgeParams calldata params;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      params := bridgeParams.offset
    }

    // finalize withdrawal on L1
    L1_SHARED_BRIDGE.finalizeWithdrawal(
      bridgeParams.chainId,
      bridgeParams.l2BatchNumber,
      bridgeParams.l2MessageIndex,
      bridgeParams.l2TxNumberInBatch,
      bridgeParams.message,
      bridgeParams.merkleProof
    );
  }
}
