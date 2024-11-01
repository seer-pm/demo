// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./IRecipient.sol";

contract GovernedRecipient is IRecipient {
    address public governor; // The address that can make governance changes to the parameters of the contract.
    mapping(address => bool) public recipients; // True if the address is a recipient. 

    modifier onlyGovernor() {
        require(msg.sender == governor, "The caller must be the governor");
        _;
    }

    /// @dev Constructor.
    constructor() {
        governor = msg.sender;
    }

    /// @dev Change the governor of the contract.
    /// @param _governor The address of the new governor.
    function changeGovernor(address _governor) external onlyGovernor {
        governor = _governor;
    }

    /// @dev Check if an address is elibigle.
    /// @param _user The address to check if eligible.
    function isEligible(address _user) external view returns (bool) {
        return recipients[_user];
    }

    /// @dev Add recipients.
    /// @param _newRecipients The recipients to add.
    function addRecipients(address[] memory _newRecipients) onlyGovernor external {
        for (uint i; i<_newRecipients.length; ++i) {
            recipients[_newRecipients[i]] = true;
        }
    }

    /// @dev Remove recipients.
    /// @param _oldRecipients The recipients to remove.
    function removeRecipients(address[] memory _oldRecipients) onlyGovernor external {
        for (uint i; i<_oldRecipients.length; ++i) {
            recipients[_oldRecipients[i]] = false;
        }
    }

}