// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract RewardsRootMock {
    bytes32 public root;

    function accept(bytes32 accepted) external {
        root = accepted;
    }
}
