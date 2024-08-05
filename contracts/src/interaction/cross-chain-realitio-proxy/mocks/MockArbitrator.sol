/* solhint-disable no-unused-vars */
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

import "@kleros/erc-792/contracts/IArbitrator.sol";
import "@kleros/erc-792/contracts/IArbitrable.sol";

/**
 * @dev This is a barebones partial implementation of an ERC-792 Arbitrator.
 * This code only exists for purposes of testing and SHOULD NOT be used in production environments.
 */
contract MockArbitrator is IArbitrator {
    struct Dispute {
        DisputeStatus status;
        IArbitrable arbitrated;
        uint256 ruling;
    }

    Dispute[] public disputes;

    uint256 private constant NON_PAYABLE_VALUE = (2**256 - 2) / 2;

    uint256 private arbitrationFee;

    constructor(uint256 _arbitrationFee) public {
        arbitrationFee = _arbitrationFee;
    }

    function createDispute(uint256 _choices, bytes calldata _extraData)
        external
        payable
        override
        returns (uint256 disputeID)
    {
        Dispute storage dispute = disputes.push();
        dispute.arbitrated = IArbitrable(msg.sender);
        disputeID = disputes.length - 1;

        emit DisputeCreation(disputeID, IArbitrable(msg.sender));

        return disputeID;
    }

    function setArbitrationCost(uint256 _arbitrationFee) external {
        arbitrationFee = _arbitrationFee;
    }

    function arbitrationCost(bytes calldata _extraData) external view override returns (uint256 cost) {
        return arbitrationFee;
    }

    function appeal(uint256 _disputeID, bytes calldata _extraData) external payable override {
        revert("Not implemented");
    }

    function appealCost(uint256 _disputeID, bytes calldata _extraData) external view override returns (uint256 cost) {
        return NON_PAYABLE_VALUE;
    }

    function appealPeriod(uint256 _disputeID) external view override returns (uint256 start, uint256 end) {
        return (0, 0);
    }

    function disputeStatus(uint256 _disputeID) external view override returns (DisputeStatus status) {
        Dispute storage dispute = disputes[_disputeID];
        return dispute.status;
    }

    function currentRuling(uint256 _disputeID) external view override returns (uint256 ruling) {
        Dispute storage dispute = disputes[_disputeID];
        return dispute.ruling;
    }

    function rule(uint256 _disputeID, uint256 _ruling) external {
        Dispute storage dispute = disputes[_disputeID];
        require(dispute.status != DisputeStatus.Solved, "Dispute already solved");

        dispute.status = DisputeStatus.Solved;
        dispute.ruling = _ruling;

        dispute.arbitrated.rule(_disputeID, _ruling);
    }
}
