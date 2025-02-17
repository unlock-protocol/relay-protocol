// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import {RelayPool, OriginParam} from "./RelayPool.sol";

contract RelayPoolFactory {
  address immutable hyperlaneMailbox;
  address immutable wrappedEth;
  address immutable timelockTemplate;

  event PoolDeployed(
    address indexed pool,
    address indexed creator,
    address indexed asset,
    string name,
    string symbol,
    OriginParam[] origins,
    address thirdPartyPool,
    address timelock
  );

  constructor(address hMailbox, address weth, address timelock) {
    hyperlaneMailbox = hMailbox;
    wrappedEth = weth;
    timelockTemplate = timelock;
  }

  function deployPool(
    ERC20 asset,
    string memory name,
    string memory symbol,
    OriginParam[] memory origins,
    address thirdPartyPool,
    uint timelockDelay
  ) public returns (address) {
    address[] memory curator = new address[](1);
    curator[0] = msg.sender;

    // clone timelock
    address timelock = Clones.clone(timelockTemplate);

    RelayPool pool = new RelayPool(
      hyperlaneMailbox,
      asset,
      name,
      symbol,
      origins,
      thirdPartyPool,
      wrappedEth,
      timelock
    );

    emit PoolDeployed(
      address(pool),
      msg.sender,
      address(asset),
      name,
      symbol,
      origins,
      thirdPartyPool,
      timelock
    );

    return address(pool);
  }
}
