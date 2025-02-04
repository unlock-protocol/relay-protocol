/* solhint-disable one-contract-per-file */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IUniversalRouter} from "./interfaces/uniswap/IUniversalRouter.sol";
import {IPermit2} from "./interfaces/uniswap/IPermit2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRelayPool} from "./interfaces/IRelayPool.sol";

library SafeCast160 {
  error UnsafeCast();

  /// @notice Safely casts uint256 to uint160
  /// @param value The uint256 to be cast
  function toUint160(uint256 value) internal pure returns (uint160) {
    if (value > type(uint160).max) revert UnsafeCast();
    return uint160(value);
  }
}

/**
 * @title TokenSwap
 * @notice A helper contract to swap tokens
 */
contract TokenSwap {
  // make sure we dont exceed type uint160 when casting
  using SafeCast160 for uint256;

  // from '@uniswap/universal-router-sdk'
  address public immutable PERMIT2_ADDRESS =
    0x000000000022D473030F116dDEE9F6B43aC78BA3;

  // required by Uniswap Universal Router
  address public uniswapUniversalRouter;

  // specified in https://docs.uniswap.org/contracts/universal-router/technical-reference#v3_swap_exact_in
  uint256 internal constant V3_SWAP_EXACT_IN = 0x00;

  // events
  event TokenSwapped(
    address pool,
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut
  );

  // errors
  error TokenSwappedFailed(
    address uniswapUniversalRouter,
    address tokenIn,
    uint256 amount
  );
  error UnauthorizedSwap();

  /**
   * Set the address of Uniswap Permit2 helper contract
   * @param _uniswapUniversalRouter the address of Uniswap Universal Router
   */
  constructor(address _uniswapUniversalRouter) {
    uniswapUniversalRouter = _uniswapUniversalRouter;
  }

  /**
   * Simple helper to retrieve balance in ERC20 or native tokens
   * @param token the address of the token (address(0) for native token)
   */
  function getBalance(address token) internal view returns (uint256) {
    return IERC20(token).balanceOf(address(this));
  }

  /**
   * Swap tokens to UDT and burn the tokens
   *
   * @notice The default route is token > WETH > asset.
   * If `uniswapWethPoolFeeAsset` is set to null, then we do a direct swap token > asset
   */
  function swap(
    address tokenAddress,
    uint24 uniswapWethPoolFeeToken,
    uint24 uniswapWethPoolFeeAsset
  ) public payable returns (uint256 amountOut) {
    // get info from pool
    address pool = msg.sender;
    address asset = IRelayPool(pool).asset();
    address wrappedAddress = IRelayPool(pool).WETH();

    // get total balance of token to swap
    uint256 tokenAmount = getBalance(tokenAddress);
    uint256 assetAmountBefore = getBalance(asset);

    if (tokenAddress == asset) {
      revert UnauthorizedSwap();
    }

    // Approve the router to spend src ERC20
    TransferHelper.safeApprove(
      tokenAddress,
      uniswapUniversalRouter,
      tokenAmount
    );

    // approve PERMIT2 to manipulate the token
    IERC20(tokenAddress).approve(PERMIT2_ADDRESS, tokenAmount);

    // issue PERMIT2 Allowance
    IPermit2(PERMIT2_ADDRESS).approve(
      tokenAddress,
      uniswapUniversalRouter,
      tokenAmount.toUint160(),
      uint48(block.timestamp + 60) // expires after 1min
    );

    // parse the path
    bytes memory path = uniswapWethPoolFeeAsset == 0
      ? abi.encodePacked(tokenAddress, uniswapWethPoolFeeToken, asset) // if no pool fee for asset, then do direct swap
      : abi.encodePacked(tokenAddress, uniswapWethPoolFeeToken, wrappedAddress); // else default to token > WETH

    // add WETH > asset to path if needed
    if (uniswapWethPoolFeeAsset != 0 && asset != wrappedAddress) {
      path = abi.encodePacked(path, uniswapWethPoolFeeAsset, asset);
    }

    // encode parameters for the swap om UniversalRouter
    bytes memory commands = abi.encodePacked(bytes1(uint8(V3_SWAP_EXACT_IN)));
    bytes[] memory inputs = new bytes[](1);
    inputs[0] = abi.encode(
      address(this), // recipient is this contract
      tokenAmount, // amountIn
      0, // amountOutMinimum
      path,
      true // funds are not coming from PERMIT2
    );

    // Executes the swap.
    IUniversalRouter(uniswapUniversalRouter).execute(
      commands,
      inputs,
      block.timestamp + 60 // expires after 1min
    );

    // check if assets have actually been swapped
    amountOut = getBalance(asset) - assetAmountBefore;
    if (amountOut == 0) {
      revert TokenSwappedFailed(
        uniswapUniversalRouter,
        tokenAddress,
        tokenAmount
      );
    }

    // transfer the swapped asset to the pool
    IERC20(asset).transfer(pool, amountOut);
    emit TokenSwapped(pool, tokenAddress, tokenAmount, amountOut);
  }

  // required to withdraw WETH
  receive() external payable {}
}
