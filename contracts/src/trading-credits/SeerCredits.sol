// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @title SeerCredits
/// @notice ERC20 token representing trading credits that users can spend on DEX swaps
contract SeerCredits is ERC20 {
    address public governor; // The address that can make governance changes to the parameters of the contract.
    address public creditsManager; // The address that can burn tokens (CreditsManager contract).

    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call this function");
        _;
    }

    modifier onlyCreditsManager() {
        require(msg.sender == creditsManager, "Only credits manager can call this function");
        _;
    }

    /// @dev Constructor.
    /// @param _governor The trusted governor of the contract.
    constructor(address _governor) ERC20("Seer Credits", "SEER_CREDITS", 18) {
        governor = _governor;
        creditsManager = _governor;
    }

    /// @dev Change the governor of the contract.
    /// @param _governor The address of the new governor.
    function changeGovernor(address _governor) external onlyGovernor {
        governor = _governor;
    }

    /// @dev Change the credits manager of the contract.
    /// @param _creditsManager The address of the new credits manager.
    function changeCreditsManager(address _creditsManager) external onlyGovernor {
        creditsManager = _creditsManager;
    }

    function mint(address to, uint256 amount) external onlyGovernor {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyCreditsManager {
        _burn(from, amount);
    }


    /// @dev Set credits balance for multiple addresses by minting or burning as needed.
    /// @param _addresses The list of addresses to set credits balance for.
    /// @param _amounts The list of amounts corresponding to each address.
    function setCreditsBalance(address[] memory _addresses, uint256[] memory _amounts) external onlyGovernor {
        require(_addresses.length == _amounts.length, "Arrays length mismatch");
        for (uint256 i; i < _addresses.length; ++i) {
            uint256 currentBalance = this.balanceOf(_addresses[i]);
            uint256 targetBalance = _amounts[i];
            
            if (currentBalance > targetBalance) {
                // Burn excess tokens
                uint256 burnAmount = currentBalance - targetBalance;
                _burn(_addresses[i], burnAmount);
            } else if (targetBalance > currentBalance) {
                // Mint additional tokens
                uint256 mintAmount = targetBalance - currentBalance;
                _mint(_addresses[i], mintAmount);
            }
            // If currentBalance == targetBalance, do nothing
        }
    }
}