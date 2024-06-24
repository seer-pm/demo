// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISavingsXDai is IERC20 {
    function convertToShares(uint256 assets) external view returns (uint256);
}
