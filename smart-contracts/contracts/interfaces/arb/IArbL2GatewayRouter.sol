// SPDX-License-Identifier: Unknown
pragma solidity ^0.8.0;

// sadly, no interface availabel in npm package
// from https://github.com/OffchainLabs/token-bridge-contracts/blob/main/contracts/tokenbridge/arbitrum/gateway/L2GatewayRouter.sol
interface IL2GatewayRouter {
  function calculateL2TokenAddress(
    address l1ERC20
  ) external view returns (address);

  function outboundTransfer(
    address _l1Token,
    address _to,
    uint256 _amount,
    bytes calldata _data
  ) external payable returns (bytes memory);
}
