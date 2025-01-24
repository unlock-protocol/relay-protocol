// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import {IUniversalRouter} from "./interfaces/uniswap/IUniversalRouter.sol";
import {IPermit2} from "./interfaces/uniswap/IPermit2.sol";
import {IWETH} from "./interfaces/IWETH.sol";
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

contract SwapAndDeposit {
  // make sure we dont exceed type uint160 when casting
  using SafeCast160 for uint256;

  // required by Uniswap Universal Router
  address public permit2;
  address public uniswapUniversalRouter;

  // specified in https://docs.uniswap.org/contracts/universal-router/technical-reference#v3_swap_exact_in
  uint256 constant V3_SWAP_EXACT_IN = 0x00;

  // events
  event SwappedDeposit(
    address pool,
    address tokenIn,
    uint amountIn,
    uint amountDeposited
  );

  // errors
  error SwappedDepositFailed(
    address uniswapUniversalRouter,
    address tokenIn,
    uint amount
  );
  error UnauthorizedSwap();

  /**
   * Set the address of Uniswap Permit2 helper contract
   * @param _permit2Address the address of Uniswap PERMIT2 contract
   */
  constructor(address _permit2Address, address _uniswapUniversalRouter) {
    permit2 = _permit2Address;
    uniswapUniversalRouter = _uniswapUniversalRouter;
  }

  /**
   * Simple helper to retrieve balance in ERC20 or native tokens
   * @param token the address of the token (address(0) for native token)
   * @param account the address to check balance
   */
  function getBalance(
    address token,
    address account
  ) internal view returns (uint) {
    return
      token == address(0) ? account.balance : IERC20(token).balanceOf(account);
  }

  /**
   * Swap tokens to UDT and burn the tokens
   */
  function swapAndDeposit(
    address pool,
    address tokenAddress,
    uint24 uniswapPoolFee
  ) public payable returns (uint amount) {
    // get info from pool
    address asset = IRelayPool(pool).asset();
    address wrappedAddress = IRelayPool(pool).WETH();

    // get total balance of token to swap
    uint tokenAmount = getBalance(tokenAddress, pool);
    uint assetAmountBefore = getBalance(asset, pool);

    if (tokenAddress == asset) {
      revert UnauthorizedSwap();
    }

    // wrap native tokens
    if (tokenAddress == address(0)) {
      IWETH(wrappedAddress).deposit{value: tokenAmount}();
      tokenAddress = wrappedAddress;
      tokenAmount = getBalance(tokenAddress, pool);
    }

    // approve ERC20 spending
    if (tokenAddress != address(0)) {
      // Approve the router to spend src ERC20
      TransferHelper.safeApprove(
        tokenAddress,
        uniswapUniversalRouter,
        tokenAmount
      );

      // approve PERMIT2 to manipulate the token
      IERC20(tokenAddress).approve(permit2, tokenAmount);
    }

    // issue PERMIT2 Allowance
    IPermit2(permit2).approve(
      tokenAddress,
      uniswapUniversalRouter,
      tokenAmount.toUint160(),
      uint48(block.timestamp + 60) // expires after 1min
    );

    // by default just swap using WETH pool
    bytes memory defaultPath = abi.encodePacked(
      wrappedAddress,
      uniswapPoolFee, // uniswap pool fee
      asset
    );

    // encode parameters for the swap om UniversalRouter
    bytes memory commands = abi.encodePacked(bytes1(uint8(V3_SWAP_EXACT_IN)));
    bytes[] memory inputs = new bytes[](1);
    inputs[0] = abi.encode(
      pool, // recipient is the pool
      tokenAmount, // amountIn
      0, // amountOutMinimum
      tokenAddress == wrappedAddress
        ? defaultPath
        : abi.encodePacked(tokenAddress, uniswapPoolFee, defaultPath), // path
      true // funds are not coming from PERMIT2
    );

    // Executes the swap.
    IUniversalRouter(uniswapUniversalRouter).execute(
      commands,
      inputs,
      block.timestamp + 60 // expires after 1min
    );

    // check if assets have actually been swapped
    uint amountOut = getBalance(asset, pool) - assetAmountBefore;
    if (amountOut == 0) {
      revert SwappedDepositFailed(
        uniswapUniversalRouter,
        tokenAddress,
        tokenAmount
      );
    }

    // emit event
    emit SwappedDeposit(pool, tokenAddress, tokenAmount, amountOut);
  }

  // required to withdraw WETH
  receive() external payable {}
}
