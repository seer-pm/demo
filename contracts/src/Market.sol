/**
 *  @authors: []
 *  @reviewers: [@nvm1410]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./RealityProxy.sol";

contract Market {
    bool public initialized;

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

    function getQuestionsCount() external view returns (uint256) {
        return questionsIds.length;
    }

    function numOutcomes() external view returns (uint256) {
        return outcomes.length;
    }

    function resolve() external {
        realityProxy.resolve(this);
    }
}
