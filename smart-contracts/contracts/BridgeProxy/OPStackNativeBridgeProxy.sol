// SPDX-License-Identifier: Unknown
pragma solidity ^0.8.28;

import {BridgeProxy} from "./BridgeProxy.sol";
import {L2StandardBridge} from "../interfaces/L2StandardBridge.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOptimismPortal, Types} from "../interfaces/IOptimismPortal.sol";
import {IOptimismMintableERC20} from "../interfaces/IOptimismMintableERC20.sol";

// import "hardhat/console.sol";

contract OPStackNativeBridgeProxy is BridgeProxy {
  address public constant STANDARD_BRIDGE =
    address(0x4200000000000000000000000000000000000010);

  address public immutable PORTAL_PROXY;

  constructor(address portalProxy) BridgeProxy() {
    PORTAL_PROXY = portalProxy;
  }

  function bridge(
    address sender,
    uint32, // destinationChainId,
    address recipient,
    address currency,
    uint256 amount,
    bytes calldata data
  ) external payable override {
    if (currency == address(0)) {
      L2StandardBridge(STANDARD_BRIDGE).bridgeETHTo{value: amount}(
        recipient,
        200000,
        data
      );
    } else {
      // First, check that this is a "bridged ERC20" token
      address l1Token = IOptimismMintableERC20(currency).remoteToken();
      if (l1Token == address(0)) {
        revert TOKEN_NOT_BRIDGED(currency);
      }

      // Take the ERC20 tokens from the sender
      IOptimismMintableERC20(currency).transferFrom(
        sender,
        address(this),
        amount
      );
      // Bridge!
      L2StandardBridge(STANDARD_BRIDGE).bridgeERC20To(
        currency,
        l1Token,
        recipient,
        amount,
        200000,
        data
      );
    }
  }

  // This should be called by the Pool contract as a way to claim funds

  function claim() external override onlyRelayPool returns (uint256) {
    // if (msg.sender != RELAY_POOL && block.chainid != address(this)) {
    //   revert("Only the relay pool can claim funds");
    // }
    // (bytes memory transaction, address proofSubmitter) = abi.decode(
    //   bridgeParams,
    //   (bytes, address)
    // );
    // (
    //   uint256 nonce,
    //   address sender,
    //   address target,
    //   uint256 value,
    //   uint256 minGasLimit,
    //   bytes memory message
    // ) = abi.decode(
    //     transaction,
    //     (uint256, address, address, uint256, uint256, bytes)
    //   );
    // Types.WithdrawalTransaction memory withdrawalTransaction = Types
    //   .WithdrawalTransaction({
    //     nonce: nonce,
    //     sender: sender,
    //     target: target,
    //     value: value,
    //     gasLimit: minGasLimit,
    //     data: message
    //   });
    // // Call portal to withdraw
    // IOptimismPortal(PORTAL_PROXY).finalizeWithdrawalTransactionExternalProof(
    //   withdrawalTransaction,
    //   proofSubmitter
    // );
    // // TODO: we MUST get the content of `message` to identify _which_ transfer(s) was received
    // // so we can handle failed "fast transfers"
    // return IERC20(currency).balanceOf(address(this));
  }
}
