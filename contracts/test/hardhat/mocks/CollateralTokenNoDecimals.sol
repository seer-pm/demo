// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/// @dev A token without decimals(), to check that it is rejected as collateral.
contract CollateralTokenNoDecimals {
    function symbol() external pure returns (string memory) {
        return "NOD";
    }
}
