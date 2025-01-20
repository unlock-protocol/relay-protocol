// PDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// Just a simple ERC20 token with permit to use as asset in tests!
contract MyToken is ERC20, ERC20Permit {
  constructor(
    string memory name,
    string memory symbol
  ) ERC20(name, symbol) ERC20Permit(name) {
    _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
  }

  function mint(uint256 amount) external {
    _mint(msg.sender, amount);
  }

  function mintFor(uint256 amount, address recipient) external {
    _mint(recipient, amount);
  }
}
