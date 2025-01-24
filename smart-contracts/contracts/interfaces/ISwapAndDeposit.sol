// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface ISwapAndDeposit {
  function swapAndDeposit(
    address pool,
    uint24 uniswapWethPoolFeeToken,
    uint24 uniswapWethPoolFeeAsset
  ) external payable returns (uint amount);
}
