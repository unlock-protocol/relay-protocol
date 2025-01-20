// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IHyperlaneMailbox {
  function dispatch(
    uint32 receiverChainId,
    bytes32 receiverAddress,
    bytes calldata data
  ) external payable returns (bytes32 id);

  function quoteDispatch(
    uint32 receiverChainId,
    bytes32 receiverAddress,
    bytes calldata data
  ) external returns (uint256 fee);

  function dispatch(
    uint32 destinationDomain,
    bytes32 recipientAddress,
    bytes calldata body,
    bytes calldata defaultHookMetadata
  ) external payable returns (bytes32 messageId);

  function quoteDispatch(
    uint32 destinationDomain,
    bytes32 recipientAddress,
    bytes calldata messageBody,
    bytes calldata defaultHookMetadata
  ) external view returns (uint256 fee);
}
