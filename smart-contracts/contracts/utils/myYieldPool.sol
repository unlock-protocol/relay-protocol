// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract MyYieldPool is ERC4626 {
  uint256 public maxPoolDeposit = type(uint256).max;
  uint256 public maxPoolWithdraw = type(uint256).max;

  constructor(
    IERC20 asset,
    string memory name,
    string memory symbol
  ) ERC20(name, symbol) ERC4626(asset) {}

  function setMaxDeposit(uint256 newMaxDeposit) public {
    uint256 assetBalance = ERC20(ERC4626.asset()).balanceOf(address(this));
    if (assetBalance > type(uint256).max - newMaxDeposit) {
      maxPoolDeposit = newMaxDeposit - assetBalance;
    } else {
      maxPoolDeposit = newMaxDeposit;
    }
  }

  function maxDeposit(address) public view override returns (uint256) {
    uint256 assetBalance = ERC20(ERC4626.asset()).balanceOf(address(this));
    if (maxPoolDeposit < assetBalance) {
      return 0;
    }
    return maxPoolDeposit - assetBalance;
  }

  function setMaxWithdraw(uint256 newMaxWithdraw) public {
    maxPoolWithdraw = newMaxWithdraw;
  }

  function maxWithdraw(address) public view override returns (uint256) {
    uint256 userAssets = convertToAssets(balanceOf(msg.sender));
    if (maxPoolWithdraw > userAssets) {
      return maxPoolWithdraw - userAssets;
    }
    return maxPoolWithdraw;
  }
}
