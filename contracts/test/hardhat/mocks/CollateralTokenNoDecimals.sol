// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/// @dev A token without decimals(), to check that the outcome tokens fall back to 18.
contract CollateralTokenNoDecimals {
    function symbol() external pure returns (string memory) {
        return "NOD";
    }
}
