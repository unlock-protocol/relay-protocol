// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// https://docs.arbitrum.io/build-decentralized-apps/token-bridging/token-bridge-erc20

import {BridgeProxy} from "./BridgeProxy.sol";
import {IL2GatewayRouter} from "../interfaces/arb/IArbL2GatewayRouter.sol";
import {IArbSys} from "../interfaces/arb/IArbSys.sol";
import {IOutbox} from "../interfaces/arb/IOutbox.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// errors
error WrongSender(address sender);

contract ArbitrumOrbitNativeBridgeProxy is BridgeProxy {
  // arb pre-compiles
  IArbSys public immutable ARB_SYS =
    IArbSys(0x0000000000000000000000000000000000000064);

  IL2GatewayRouter public immutable ROUTER;
  IOutbox public immutable OUTBOX;

  /**
   * params will be stored as immutable values in the bytecode
   * @param routerGateway the ARB router gateway contract
   */
  constructor(address routerGateway, address outbox) BridgeProxy() {
    ROUTER = IL2GatewayRouter(routerGateway);
    OUTBOX = IOutbox(outbox);
  }

  function bridge(
    address sender,
    uint32, // destinationChainId,
    address recipient,
    address l1Currency, //l1 token
    uint256 amount,
    bytes calldata /* data*/
  ) external payable override {
    // send native tokens to L1
    if (l1Currency == address(0)) {
      ARB_SYS.withdrawEth{value: amount}(recipient);
    } else {
      // get l2 token from l1 address
      address l2token = ROUTER.calculateL2TokenAddress(l1Currency);

      // Take the ERC20 tokens from the sender
      IERC20(l2token).transferFrom(sender, address(this), amount);

      // here we have to pass empty data as data has been disabled in the default
      // gateway (see EXTRA_DATA_DISABLED in Arbitrum's L2GatewayRouter.sol)
      ROUTER.outboundTransfer(l1Currency, recipient, amount, "");
    }
  }

  struct BridgeParams {
    bytes32[] proof;
    uint256 index;
    address l2Sender;
    address to;
    uint256 l2Block;
    uint256 l1Block;
    uint256 l2Timestamp;
    uint256 value;
    bytes data;
  }

  function claim(
    address, // currency
    bytes calldata bridgeParams
  ) external override returns (uint256 amount) {
    // unpack args using assembly so we can keep it
    // as bytes 'calldata' to later decode the data
    // to finalize transfer in the outbox contract
    BridgeParams calldata params;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      params := bridgeParams.offset
    }

    // if data is null, it means that the token is native
    if (params.data.length == 0) {
      amount = params.value;
    } else {
      // if ERC20, we get the amount from `finalizeInboundTransfer` encoded data
      // See {IL1Arbitrum/IToken/ICustom/Gateway-finalizeInboundTransfer} in their repo
      // for general pattern followed by all ARB L1/L2 gateways
      (, , , amount, ) = abi.decode(
        params.data[4:], // remove finalizeInboundTransfer signature
        (address, address, address, uint256, bytes)
      );
    }

    // send withdrawal request to the outbox contract
    OUTBOX.executeTransaction(
      params.proof,
      params.index,
      params.l2Sender,
      params.to,
      params.l2Block,
      params.l1Block,
      params.l2Timestamp,
      params.value,
      params.data
    );
  }
}
