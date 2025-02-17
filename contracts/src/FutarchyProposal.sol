/**
 *  @authors: [@xyzseer]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./FutarchyRealityProxy.sol";
import {IERC20} from "./Interfaces.sol";

contract FutarchyProposal {
    /// @dev Flag to initialize the proposal only once.
    bool public initialized;

    /// @dev Contains the information associated to the proposal.
    /// @param conditionId Conditional Tokens conditionId.
    /// @param collateralToken1 First collateral token.
    /// @param collateralToken2 Second collateral token.
    /// @param parentCollectionId Conditional Tokens parentCollectionId.
    /// @param parentOutcome Conditional outcome to use (optional).
    /// @param parentMarket Conditional proposal to use (optional).
    /// @param questionId Conditional Tokens questionId.
    /// @param encodedQuestion Encoded question, needed to create and reopen a question.
    /// @param wrapped1155 Outcome tokens Wrapped1155 address.
    /// @param data Wrapped1155 token data.
    struct FutarchyProposalParams {
        bytes32 conditionId;
        IERC20 collateralToken1;
        IERC20 collateralToken2;
        bytes32 parentCollectionId;
        uint256 parentOutcome;
        address parentMarket;
        bytes32 questionId;
        string encodedQuestion;
        IERC20[] wrapped1155;
        bytes[] tokenData;
    }

    /// @dev The name of the proposal.
    string public marketName;
    /// @dev The proposal outcomes.
    string[] public outcomes;
    /// @dev Proposal parameters.
    FutarchyProposalParams public futarchyProposalParams;
    /// @dev Oracle contract.
    FutarchyRealityProxy public realityProxy;

    /// @dev Initializer.
    /// @param _marketName The name of the proposal.
    /// @param _outcomes The proposal outcomes.
    /// @param _futarchyProposalParams Futarchy Proposal params.
    /// @param _realityProxy Oracle contract.
    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        FutarchyProposalParams memory _futarchyProposalParams,
        FutarchyRealityProxy _realityProxy
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        futarchyProposalParams = _futarchyProposalParams;
        realityProxy = _realityProxy;

        initialized = true;
    }

    /// @dev Encoded question parameters, needed to create and reopen a question.
    /// @return The encoded question.
    function encodedQuestion() external view returns (string memory) {
        return futarchyProposalParams.encodedQuestion;
    }

    /// @dev Conditional Tokens questionId.
    /// @return the question ID.
    function questionId() external view returns (bytes32) {
        return futarchyProposalParams.questionId;
    }

    /// @dev Conditional Tokens conditionId.
    /// @return The condition ID.
    function conditionId() external view returns (bytes32) {
        return futarchyProposalParams.conditionId;
    }

    /// @dev First collateral token.
    /// @return The collateral token.
    function collateralToken1() external view returns (IERC20) {
        return futarchyProposalParams.collateralToken1;
    }

    /// @dev Second collateral token.
    /// @return The collateral token.
    function collateralToken2() external view returns (IERC20) {
        return futarchyProposalParams.collateralToken2;
    }

    /// @dev Conditional Tokens parentCollectionId.
    /// @return The parent collection ID.
    function parentCollectionId() external view returns (bytes32) {
        return futarchyProposalParams.parentCollectionId;
    }

    /// @dev The parent proposal (optional). This proposal redeems to an outcome token of the parent proposal.
    /// @return The parent proposal address.
    function parentMarket() external view returns (address) {
        return futarchyProposalParams.parentMarket;
    }

    /// @dev The parent outcome (optional). The parent proposal's outcome token this proposal redeems for.
    /// @return The parent outcome index.
    function parentOutcome() external view returns (uint256) {
        return futarchyProposalParams.parentOutcome;
    }

    /// @dev Returns the wrapped1155 and the data corresponding to an outcome token.
    /// @param index The outcome index.
    /// @return wrapped1155 The wrapped token.
    /// @return data The token data.
    function wrappedOutcome(uint256 index) external view returns (IERC20 wrapped1155, bytes memory data) {
        return (futarchyProposalParams.wrapped1155[index], futarchyProposalParams.tokenData[index]);
    }

    /// @dev Returns the wrapped1155 and the data corresponding to the parent proposal.
    /// @return wrapped1155 The wrapped token.
    /// @return data The token data.
    function parentWrappedOutcome() external view returns (IERC20 wrapped1155, bytes memory data) {
        if (futarchyProposalParams.parentMarket != address(0)) {
            (wrapped1155, data) = FutarchyProposal(futarchyProposalParams.parentMarket).wrappedOutcome(
                futarchyProposalParams.parentOutcome
            );
        }
    }

    /// @dev Returns the number of outcomes.
    /// @return numOutcomes The number of outcomes.
    function numOutcomes() external view returns (uint256) {
        return outcomes.length;
    }

    /// @dev Helper function to resolve the proposal.
    function resolve() external {
        realityProxy.resolve(this);
    }
}
