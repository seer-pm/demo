/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./RealityProxy.sol";

contract Market {
    bool public initialized; // Flag to initialize the market only once

    string public marketName; // The name of the market
    string[] public outcomes; // The market outcomes, doesn't include the INVALID_RESULT outcome
    uint256 public lowerBound; // Lower bound, only used for scalar markets
    uint256 public upperBound; // Upper bound, only user for scalar markets
    bytes32 public conditionId; // Conditional Tokens conditionId
    bytes32 public questionId; // Conditional Tokens questionId
    bytes32[] public questionsIds; // Reality questions ids
    uint256 public templateId; // Reality templateId
    string[] public encodedQuestions; // Encoded questions parameters, needed to create and reopen a question
    RealityProxy public realityProxy; // Oracle contract

    /// @dev Initializer
    /// @param _marketName The name of the market
    /// @param _outcomes The market outcomes, doesn't include the INVALID_RESULT outcome
    /// @param _lowerBound Lower bound, only used for scalar markets
    /// @param _upperBound Upper bound, only user for scalar markets
    /// @param _conditionId Conditional Tokens conditionId
    /// @param _questionId Conditional Tokens questionId
    /// @param _questionsIds Reality questions ids
    /// @param _templateId Reality templateId
    /// @param _encodedQuestions Encoded questions parameters, needed to create and reopen a question
    /// @param _realityProxy Oracle contract
    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        uint256 _lowerBound,
        uint256 _upperBound,
        bytes32 _conditionId,
        bytes32 _questionId,
        bytes32[] memory _questionsIds,
        uint256 _templateId,
        string[] memory _encodedQuestions,
        RealityProxy _realityProxy
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        lowerBound = _lowerBound;
        upperBound = _upperBound;
        conditionId = _conditionId;
        questionId = _questionId;
        questionsIds = _questionsIds;
        templateId = _templateId;
        encodedQuestions = _encodedQuestions;
        realityProxy = _realityProxy;

        initialized = true;
    }

    /// @dev Multi Scalar markets have one question for each outcome, while any other market has only one question.
    /// @return questionsCount The number of Reality questions of this market
    function getQuestionsCount() external view returns (uint256) {
        return questionsIds.length;
    }

    /// @dev Returns the number of outcomes.
    /// Doesn't include the INVALID_RESULT outcome.
    /// @return numOutcomes The number of outcomes
    function numOutcomes() external view returns (uint256) {
        return outcomes.length;
    }

    /// @dev Helper function to resolve the market
    function resolve() external {
        realityProxy.resolve(this);
    }
}
