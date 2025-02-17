// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import {RelayPool, OriginParam} from "./RelayPool.sol";

// import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

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
    address thirdPartyPool,
    address timelock
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
    address thirdPartyPool,
    uint timelockDelay
  ) public returns (address) {
    // Deploy a timelock!
    address[] memory curator = new address[](1);
    curator[0] = msg.sender;

    TimelockController timelock = new TimelockController(
      timelockDelay,
      curator,
      curator,
      address(0) // No admin
    );

    RelayPool pool = new RelayPool(
      hyperlaneMailbox,
      asset,
      name,
      symbol,
      origins,
      thirdPartyPool,
      wrappedEth,
      address(timelock)
    );

    emit PoolDeployed(
      address(pool),
      msg.sender,
      address(asset),
      name,
      symbol,
      origins,
      thirdPartyPool,
      address(timelock)
    );

    return address(pool);
  }
}
