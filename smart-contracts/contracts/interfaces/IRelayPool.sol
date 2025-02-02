// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

interface IRelayPool is IERC4626 {
  function WETH() external view returns (address);
}
