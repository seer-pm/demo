// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.18;

interface IBridgeInterestReceiver {
    // mutations
    function claim() external;

    // view functions
    function vaultAPY() external view returns (uint256);
    function previewClaimable() external view returns (uint256);

    //variables
    function claimer() external view returns (address);
    function dripRate() external view returns (uint256);
    function nextClaimEpoch() external view returns (uint256);
    function lastClaimTimestamp() external view returns (uint256);
    function currentEpochBalance() external view returns (uint256);
    function epochLength() external view returns (uint256);
}
