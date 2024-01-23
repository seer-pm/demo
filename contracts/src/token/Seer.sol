// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

contract Seer is ERC20 {
    address public governor; // The address that can make governance changes to the parameters of the contract.

    modifier onlyGovernor() {
        require(msg.sender == governor, "The caller must be the governor");
        _;
    }

    /// @dev Constructor.
    /// @param _governor The trusted governor of the contract.
    constructor(address _governor) ERC20("Seer", "SEER", 18) {
        governor = _governor;
    }

    /// @dev Change the governor of the contract.
    /// @param _governor The address of the new governor.
    function changeGovernor(address _governor) external onlyGovernor {
        governor = _governor;
    }

    function mint(address to, uint256 amount) external onlyGovernor {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyGovernor {
        _burn(from, amount);
    }
}
