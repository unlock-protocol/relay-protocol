// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct HyperlaneMessage {
  uint256 nonce;
  address recipient;
  uint256 amount;
  uint256 timestamp;
}
