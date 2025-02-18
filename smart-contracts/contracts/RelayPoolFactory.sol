// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import {RelayPool, OriginParam} from "./RelayPool.sol";

import "hardhat/console.sol";

interface RelayPoolTimelock {
  function initialize(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address admin
  ) external;
}

contract RelayPoolFactory {
  address public immutable hyperlaneMailbox;
  address public immutable wrappedEth;
  address public immutable timelockTemplate;

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
    uint timelockDelay,
    uint256 initialDeposit
  ) public returns (address) {
    address[] memory curator = new address[](1);
    curator[0] = msg.sender;

    // clone timelock
    address timelock = Clones.clone(timelockTemplate);
    RelayPoolTimelock(timelock).initialize(
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

    // Transfer initial deposit to the pool to prevent inflation attack
    asset.transferFrom(msg.sender, address(this), initialDeposit);
    asset.approve(address(pool), initialDeposit);
    pool.deposit(initialDeposit, timelock);

    return address(pool);
  }
}
