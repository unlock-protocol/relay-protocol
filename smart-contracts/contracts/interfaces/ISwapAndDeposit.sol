// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ISwapAndDeposit {
  function swapAndDeposit(
    address pool,
    address tokenAddress,
    uint24 poolFee
  ) external payable returns (uint amount);
}
