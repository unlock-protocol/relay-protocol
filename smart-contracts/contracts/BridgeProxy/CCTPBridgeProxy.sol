// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ITokenMessenger} from "../interfaces/cctp/ITokenMessenger.sol";
import {IMessageTransmitter} from "../interfaces/cctp/IMessageTransmitter.sol";
import {BridgeProxy} from "./BridgeProxy.sol";
import {IUSDC} from "../interfaces/IUSDC.sol";

// docs
// https://developers.circle.com/stablecoins/message-format
contract CCTPBridgeProxy is BridgeProxy {
  ITokenMessenger public immutable MESSENGER;
  IMessageTransmitter public immutable TRANSMITTER;
  address public immutable USDC;

  /**
   * @param messenger the CCTP TokenMessenger address
   * @param transmitter the CCTP Trnasmitter address
   * @param usdc the USDC contract address
   *
   * see https://developers.circle.com/stablecoins/supported-domains
   */
  constructor(
    address messenger,
    address transmitter,
    address usdc
  ) BridgeProxy() {
    MESSENGER = ITokenMessenger(messenger);
    TRANSMITTER = IMessageTransmitter(transmitter);
    USDC = usdc;
  }

  function bridge(
    address sender,
    uint32 /*destinationChainId*/,
    address recipient,
    address currency,
    uint256 amount,
    bytes calldata /*data*/
  ) external payable override {
    if (currency != USDC) {
      revert TOKEN_NOT_BRIDGED(currency);
    }

    // transfer token to this contract first
    IUSDC(USDC).transferFrom(sender, address(this), amount);

    // approve messenger to manipulate USDC tokens
    IUSDC(USDC).approve(address(MESSENGER), amount);

    // burn USDC on that side of the chain
    bytes32 targetAddressBytes32 = bytes32(uint256(uint160(recipient)));
    MESSENGER.depositForBurn(
      amount,
      0, // mainnet domain is zero
      targetAddressBytes32,
      USDC
    );
  }

  function claim(
    address, // currency
    bytes calldata bridgeParams
  ) external override returns (uint256) {
    uint256 balanceBefore = IUSDC(USDC).balanceOf(address(this));
    (bytes memory messageBytes, bytes memory attestation) = abi.decode(
      bridgeParams,
      (bytes, bytes)
    );
    TRANSMITTER.receiveMessage(messageBytes, attestation);
    uint256 balanceAfter = IUSDC(USDC).balanceOf(address(this));
    return balanceAfter - balanceBefore;
  }
}
