// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev A collateral with 6 decimals, like USDC, to check that the outcome tokens mirror them.
contract CollateralToken6 is ERC20 {
    constructor() ERC20("CollateralToken6", "CT6") {
        _mint(msg.sender, 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
