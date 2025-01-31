// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {RelayPool, OriginParam} from "./RelayPool.sol";

contract RelayPoolFactory {
  address public hyperlaneMailbox;
  address public wrappedEth;

  event PoolDeployed(
    address indexed pool,
    address indexed creator,
    address indexed asset,
    string name,
    string symbol,
    OriginParam[] origins,
    address thirdPartyPool
  );

  constructor(address hMailbox, address weth) {
    hyperlaneMailbox = hMailbox;
    wrappedEth = weth;
  }

  function deployPool(
    ERC20 asset,
    string memory name,
    string memory symbol,
    OriginParam[] memory origins,
    address thirdPartyPool
  ) public returns (address) {
    RelayPool pool = new RelayPool(
      hyperlaneMailbox,
      asset,
      name,
      symbol,
      origins,
      thirdPartyPool,
      wrappedEth,
      msg.sender
    );

    emit PoolDeployed(
      address(pool),
      msg.sender,
      address(asset),
      name,
      symbol,
      origins,
      thirdPartyPool
    );

    return address(pool);
  }
}
