// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IRecipient {
    /// @dev Check if an address is eligible.
    /// @param _user The address to check if eligible.
    function isEligible(address _user) external view returns (bool);
}