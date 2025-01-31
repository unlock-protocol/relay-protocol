// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BridgeProxy} from "./BridgeProxy.sol";
import {IL1SharedBridge} from "../interfaces/zksync/IL1SharedBridge.sol";
import {IL2SharedBridge} from "../interfaces/zksync/IL2SharedBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * from https://github.com/matter-labs/era-contracts/blob/3288adb0aee6c1c3022f6c817f95234764e0d611/l1-contracts/contracts/common/libraries/UnsafeBytes.sol
 * @author Matter Labs
 * @custom:security-contact security@matterlabs.dev
 * @dev The library provides a set of functions that help read data from an "abi.encodePacked" byte array.
 * @dev Each of the functions accepts the `bytes memory` and the offset where data should be read and returns a value of a certain type.
 *
 * @dev WARNING!
 * 1) Functions don't check the length of the bytes array, so it can go out of bounds.
 * The user of the library must check for bytes length before using any functions from the library!
 *
 * 2) Read variables are not cleaned up - https://docs.soliditylang.org/en/v0.8.16/internals/variable_cleanup.html.
 * Using data in inline assembly can lead to unexpected behavior!
 */
library UnsafeBytes {
  function readUint32(
    bytes memory _bytes,
    uint256 _start
  ) internal pure returns (uint32 result, uint256 offset) {
    assembly {
      offset := add(_start, 4)
      result := mload(add(_bytes, offset))
    }
  }

  function readAddress(
    bytes memory _bytes,
    uint256 _start
  ) internal pure returns (address result, uint256 offset) {
    assembly {
      offset := add(_start, 20)
      result := mload(add(_bytes, offset))
    }
  }

  function readUint256(
    bytes memory _bytes,
    uint256 _start
  ) internal pure returns (uint256 result, uint256 offset) {
    assembly {
      offset := add(_start, 32)
      result := mload(add(_bytes, offset))
    }
  }

  function readBytes32(
    bytes memory _bytes,
    uint256 _start
  ) internal pure returns (bytes32 result, uint256 offset) {
    assembly {
      offset := add(_start, 32)
      result := mload(add(_bytes, offset))
    }
  }
}

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

  struct L2Message {
    address sender;
    bytes data;
    uint256 txNumberInblock;
  }

  function claim(
    address, // currency
    bytes calldata bridgeParams
  ) external override returns (uint256 amount) {
    // unpack args using assembly so we can keep it
    // as bytes 'calldata' to later decode the data
    // to finalize transfer in the outbox contract
    BridgeParams calldata params;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      params := bridgeParams.offset
    }

    // decode value/amount from L2 > L1 message
    amount = _parseL2WithdrawalMessage(params.message);

    // finalize withdrawal on L1
    L1_SHARED_BRIDGE.finalizeWithdrawal(
      params.chainId,
      params.l2BatchNumber,
      params.l2MessageIndex,
      params.l2TxNumberInBatch,
      params.message,
      params.merkleProof
    );
  }

  // function below is used to parse the message
  // and extract the amount of tokens claimed
  // from: https://github.com/matter-labs/era-contracts/blob/3288adb0aee6c1c3022f6c817f95234764e0d611/l1-contracts/contracts/bridge/L1SharedBridge.sol#L763
  error L2WithdrawalMessageWrongLength(uint256 messageLen);
  error InvalidSelector(bytes4 func);

  function _parseL2WithdrawalMessage(
    bytes memory _l2ToL1message
  ) internal pure returns (uint256 amount) {
    // We check that the message is long enough to read the data.
    // Please note that there are two versions of the message:
    // 1. The message that is sent by `withdraw(address _l1Receiver)`
    // It should be equal to the length of the bytes4 function signature + address l1Receiver + uint256 amount = 4 + 20 + 32 = 56 (bytes).
    // 2. The message that is sent by `withdrawWithMessage(address _l1Receiver, bytes calldata _additionalData)`
    // It should be equal to the length of the following:
    // bytes4 function signature + address l1Receiver + uint256 amount + address l2Sender + bytes _additionalData =
    // = 4 + 20 + 32 + 32 + _additionalData.length >= 68 (bytes).
    // So the data is expected to be at least 56 bytes long.
    // wrong message length
    if (_l2ToL1message.length < 56) {
      revert L2WithdrawalMessageWrongLength(_l2ToL1message.length);
    }
    (uint32 functionSignature, uint256 offset) = UnsafeBytes.readUint32(
      _l2ToL1message,
      0
    );

    // check for IMailbox.finalizeEthWithdrawal.selector
    if (bytes4(functionSignature) == 0x6c0960f9) {
      // this message is a base token withdrawal
      (, offset) = UnsafeBytes.readAddress(_l2ToL1message, offset);
      (amount, offset) = UnsafeBytes.readUint256(_l2ToL1message, offset);
      // l1Token = BRIDGE_HUB.baseToken(_chainId);
    } else if (
      bytes4(functionSignature) == 0x11a2ccc1 // IL1ERC20Bridge.finalizeWithdrawal.selector
    ) {
      // We use the IL1ERC20Bridge for backward compatibility with old withdrawals.
      // this message is a token withdrawal
      // Check that the message length is correct.
      // It should be equal to the length of the function signature + address + address + uint256 = 4 + 20 + 20 + 32 =
      // 76 (bytes).
      if (_l2ToL1message.length != 76) {
        revert L2WithdrawalMessageWrongLength(_l2ToL1message.length);
      }
      (, offset) = UnsafeBytes.readAddress(_l2ToL1message, offset);
      (, offset) = UnsafeBytes.readAddress(_l2ToL1message, offset);
      (amount, offset) = UnsafeBytes.readUint256(_l2ToL1message, offset);
    } else {
      revert InvalidSelector(bytes4(functionSignature));
    }
  }
}
