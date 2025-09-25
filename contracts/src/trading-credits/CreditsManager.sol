// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import "./SeerCredits.sol";

/// @title CreditsManager
/// @notice This contract acts as a proxy to DEXs (Uniswap, Swapr, etc.) where users can spend trading credits
/// @dev The contract receives an address `to` (expected to be a DEX router) and `data` to execute a swap
/// @dev The swap data must be encoded to send tokens to `msg.sender`
/// @dev CreditsManager pays for the swap on behalf of the user by deducting credits from their balance
contract CreditsManager {
    address public governor; // The address that can make governance changes to the parameters of the contract.
    ERC20 public token; // The token used to swap from (e.g., sDAI on Gnosis).
    SeerCredits public seerCredits; // The SeerCredits token representing trading credits.
    mapping(address => bool) public whitelistedContracts; // Whitelist of contracts that can be called.

    modifier onlyGovernor() {
        require(msg.sender == governor, "The caller must be the governor");
        _;
    }

    /// @dev Constructor.
    /// @param _token The ERC20 token used to swap from (e.g., sDAI on Gnosis). TRUSTED
    /// @param _seerCredits The SeerCredits token contract. TRUSTED
    constructor(ERC20 _token, SeerCredits _seerCredits) {
        governor = msg.sender;
        token = _token;
        seerCredits = _seerCredits;
    }

    /// @dev Change the governor of the contract.
    /// @param _governor The address of the new governor. TRUSTED
    function changeGovernor(address _governor) external onlyGovernor {
        governor = _governor;
    }


    /// @dev Add or remove a contract from the whitelist.
    /// @param _contract The address of the contract to modify.
    /// @param _whitelisted True to add to whitelist, false to remove.
    function setWhitelistedContract(address _contract, bool _whitelisted) external onlyGovernor {
        whitelistedContracts[_contract] = _whitelisted;
    }


    /// @dev Check if a user can spend a specific amount of credits.
    /// @param _user The address of the user to check.
    /// @param _amount The amount of credits to check.
    /// @return True if the user can spend the specified amount of credits.
    function canSpendCredits(address _user, uint256 _amount) external view returns (bool) {
        // Check if user has enough SeerCredits
        if (seerCredits.balanceOf(_user) < _amount) {
            return false;
        }

        // Check if contract has enough token balance
        if (token.balanceOf(address(this)) < _amount) {
            return false;
        }

        return true;
    }

    /// @dev Sweep all tokens from the contract to the governor.
    /// @param _token The token to sweep. If address(0), uses the default token.
    function sweepTokens(ERC20 _token) external onlyGovernor {
        ERC20 tokenToSweep = _token == ERC20(address(0)) ? token : _token;
        uint256 balance = tokenToSweep.balanceOf(address(this));
        require(balance > 0, "No tokens to sweep");
        require(tokenToSweep.transfer(governor, balance), "Token transfer failed");
    }

    /// @dev Execute a swap through a DEX router (Uniswap, Swapr, etc.). CreditsManager pays for the swap.
    /// @param to The DEX router address (must be whitelisted).
    /// @param data The encoded swap call data. Must be encoded to send output tokens to msg.sender.
    /// @param amount The amount of credits to spend (tokens approved to the DEX router).
    /// @param outputToken The token that the user is buying (must have increased balance after swap).
    /// @notice This function acts as a proxy - CreditsManager pays for the swap by deducting credits from user's balance.
    function execute(address to, bytes calldata data, uint256 amount, ERC20 outputToken) external {
        require(whitelistedContracts[to], "Contract not whitelisted");
        require(seerCredits.balanceOf(msg.sender) >= amount, "Insufficient credits balance");

        // Check user's balance of output token before the swap
        uint256 balanceBefore = outputToken.balanceOf(msg.sender);

        // CreditsManager approves tokens to the DEX router (e.g., Uniswap, Swapr)
        require(token.approve(to, amount), "Token approval failed");

        // Burn SeerCredits from user's balance - CreditsManager is paying for the swap
        seerCredits.burn(msg.sender, amount);

        // Execute the swap call to the DEX router
        // The swap data must be encoded to send output tokens to msg.sender
        (bool success,) = to.call(data);
        require(success, "Call failed");

        // Verify that the user received tokens (balance increased)
        // This is a security measure to verify that the swap had msg.sender as recipient,
        // otherwise the swap recipient would be CreditsManager itself
        uint256 balanceAfter = outputToken.balanceOf(msg.sender);
        require(balanceAfter > balanceBefore, "No tokens received from swap");
    }
}
