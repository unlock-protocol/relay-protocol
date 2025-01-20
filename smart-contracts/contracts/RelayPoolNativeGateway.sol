// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IWETH} from "./interfaces/IWETH.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

// import "hardhat/console.sol";

error ethTransferFailed();
error onlyWethCanSendEth();

contract RelayPoolNativeGateway {
  IWETH public immutable WETH;
  IERC4626 public immutable POOL;

  /**
   * @param wethAddress address on Wrapped Native contract
   */
  constructor(address wethAddress, address poolAddress) {
    // TODO: add some wrapped asset verification
    // cast as IWETH
    WETH = IWETH(wethAddress);
    POOL = IERC4626(poolAddress);
  }

  /**
   * @dev deposit native tokens to the WETH _reserves of msg.sender
   * @param receiver the reserve account to be credited
   */
  function depositNative(address receiver) external payable returns (uint256) {
    // wrap tokens
    WETH.deposit{value: msg.value}();
    WETH.approve(address(POOL), msg.value);

    // do the deposit
    uint256 shares = POOL.deposit(msg.value, receiver);
    return shares;
  }

  /**
   * @dev deposit native tokens to the WETH _reserves of msg.sender
   * @param receiver the reserve account to be credited
   */
  function mintNative(address receiver) external payable returns (uint256) {
    // wrap tokens
    WETH.deposit{value: msg.value}();
    WETH.approve(address(POOL), msg.value);

    // do the deposit
    uint256 shares = POOL.mint(msg.value, receiver);
    return shares;
  }

  /**
   * @dev withraw native tokens from the WETH _reserves of msg.sender
   * @param assets amout of native tokens
   * @param receiver the reserve account to be credited
   */
  function withdrawNative(
    uint256 assets,
    address receiver
  ) external virtual returns (uint256) {
    // withdraw from pool
    uint256 shares = POOL.withdraw(assets, address(this), msg.sender);

    // withdraw native tokens and send them back
    WETH.withdraw(assets);
    _safeTransferETH(receiver, assets);

    //emit event
    return shares;
  }

  /**
   * @dev redeem native tokens
   * @param assets amout of native tokens
   * @param receiver the reserve account to be credited
   */
  function redeemNative(
    uint256 assets,
    address receiver
  ) external virtual returns (uint256) {
    // withdraw from pool
    uint256 shares = POOL.redeem(assets, address(this), msg.sender);

    // withdraw native tokens and send them back
    WETH.withdraw(assets);
    _safeTransferETH(receiver, assets);

    //emit event
    return shares;
  }

  /**
   * @dev transfer ETH to an address, revert if it fails.
   * @param to recipient of the transfer
   * @param value the amount to send
   */
  function _safeTransferETH(address to, uint256 value) internal {
    (bool success, ) = to.call{value: value}(new bytes(0));
    if (!success) {
      revert ethTransferFailed();
    }
  }

  receive() external payable {
    if (msg.sender != address(WETH)) {
      revert onlyWethCanSendEth();
    }
  }
}
