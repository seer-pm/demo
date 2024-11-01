// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "solmate/src/tokens/ERC20.sol";
import "./IRecipient.sol";

contract MultiDrop {
    address public governor; // The address that can make governance changes to the parameters of the contract.
    IRecipient public recipient; // The contract indicating if an address is a recipient.
    ERC20[] public tokens; // The list of tokens to be given.
    uint[] public amounts; // The list of the amounts of tokens to give in basic units.
    mapping(address => bool) public claimed; // True if the recipient has already claimed tokens from this contract.

    modifier onlyGovernor() {
        require(msg.sender == governor, "The caller must be the governor");
        _;
    }

    /// @dev Constructor.
    /// @param _recipient The contract indicating if an address is a recipient. TRUSTED
    constructor(IRecipient _recipient) {
        governor = msg.sender;
        recipient = _recipient;
    }

    /// @dev Change the governor of the contract.
    /// @param _governor The address of the new governor. TRUSTED
    function changeGovernor(address _governor) external onlyGovernor {
        governor = _governor;
    }

    /// @dev Change the recipient contract.
    /// @param _recipient The new contract indicating if an address is a recipient.
    function changeRecipient(IRecipient _recipient) external onlyGovernor {
        recipient = _recipient;
    }

    /// @dev Add tokens to airdrop.
    /// @param _tokens The list of tokens to airdrop. TRUSTED
    /// @param _amounts The list of the amounts of tokens in basic units to airdrop.
    function addTokens(
        ERC20[] memory _tokens,
        uint[] memory _amounts
    ) external onlyGovernor {
        for (uint i; i < _tokens.length; ++i) {
            tokens.push(_tokens[i]);
            amounts.push(_amounts[i]);
        }
    }

    /// @dev Change a token and amount. To be used to replace a token (for example after the market result is known).
    /// @param _i The index of the token to change.
    /// @param _token The new token. If the address is null, no token will be given. TRUSTED
    /// @param _amount The new amuount.
    function changeToken(
        uint _i,
        ERC20 _token,
        uint _amount
    ) external onlyGovernor {
        tokens[_i] = _token;
        amounts[_i] = _amount;
    }

    /// @dev Claim the tokens. The recipient must already be registered and shouldn't have claimed yet.
    function claim() external {
        require(
            recipient.isEligible(msg.sender),
            "The sender is not eligible."
        );
        require(!claimed[msg.sender], "The sender has already claimed.");

        claimed[msg.sender] = true;

        for (uint i; i < tokens.length; ++i) {
            if (address(tokens[i]) != address(0)) {
                require(tokens[i].transfer(msg.sender, amounts[i]));
            }
        }
    }

    /// @dev Returns all the tokens.
    /// @return The addresses of the tokens.
    function allTokens() external view returns (ERC20[] memory) {
        return tokens;
    }
}
