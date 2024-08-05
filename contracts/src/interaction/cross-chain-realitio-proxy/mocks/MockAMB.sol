// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "../dependencies/IAMB.sol";

/**
 * @dev This is a barebones partial implementation of an ArbitratryMessageBridge.
 * This code only exists for purposes of testing and SHOULD NOT be used in production environments.
 */
contract MockAMB is IAMB {
    uint256 private currentMessageId;
    address private currentMessageSender;

    event MessagePassed(address _contract, bytes _data, uint256 _gas);

    function requireToPassMessage(
        address _contract,
        bytes memory _data,
        uint256 _gas
    ) external override returns (bytes32) {
        currentMessageId += 1;
        currentMessageSender = msg.sender;

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, ) = _contract.call(_data);

        require(success, "Failed to call contract");

        emit MessagePassed(_contract, _data, _gas);
        return bytes32(currentMessageId);
    }

    function maxGasPerTx() external view override returns (uint256) {
        return 8000000;
    }

    function messageSender() external view override returns (address) {
        return currentMessageSender;
    }

    function messageSourceChainId() external view override returns (bytes32) {
        return bytes32(0);
    }

    function messageId() external view override returns (bytes32) {
        return bytes32(currentMessageId);
    }
}
