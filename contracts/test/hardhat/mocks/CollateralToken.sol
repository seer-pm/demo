// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CollateralToken is ERC20 {
    constructor() ERC20("CollateralToken", "CT") {
        _mint(msg.sender, type(uint256).max);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
