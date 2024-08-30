/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./RealityProxy.sol";

contract Market {
    bool public initialized; // Flag to initialize the market only once

    struct RealityParams {
        bytes32[] questionsIds; // Reality questions ids
        uint256 templateId; // Reality templateId
        string[] encodedQuestions; // Encoded questions parameters, needed to create and reopen a question
    }

    struct ConditionalTokensParams {
        bytes32 conditionId; // Conditional Tokens conditionId
        bytes32 parentCollectionId; // Conditional Tokens parentCollectionId
        uint256 parentOutcome; // conditional outcome to use (optional)
        address parentMarket; // conditional market to use (optional)
        bytes32 questionId; // Conditional Tokens questionId
    }

    string public marketName; // The name of the market
    string[] public outcomes; // The market outcomes, doesn't include the INVALID_RESULT outcome
    uint256 public lowerBound; // Lower bound, only used for scalar markets
    uint256 public upperBound; // Upper bound, only user for scalar markets
    ConditionalTokensParams public conditionalTokensParams; // Conditional Tokens parameters
    RealityParams public realityParams; // Reality parameters
    RealityProxy public realityProxy; // Oracle contract

    /// @dev Initializer
    /// @param _marketName The name of the market
    /// @param _outcomes The market outcomes, doesn't include the INVALID_RESULT outcome
    /// @param _lowerBound Lower bound, only used for scalar markets
    /// @param _upperBound Upper bound, only user for scalar markets
    /// @param _conditionalTokensParams Conditional Tokens params
    /// @param _realityParams Reality params
    /// @param _realityProxy Oracle contract
    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        uint256 _lowerBound,
        uint256 _upperBound,
        ConditionalTokensParams memory _conditionalTokensParams,
        RealityParams memory _realityParams,
        RealityProxy _realityProxy
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        lowerBound = _lowerBound;
        upperBound = _upperBound;
        conditionalTokensParams = _conditionalTokensParams;
        realityParams = _realityParams;
        realityProxy = _realityProxy;

        initialized = true;
    }

    /// @dev The templateId associated to the Reality question
    function templateId() external view returns (uint256) {
        return realityParams.templateId;
    }

    /// @dev Returns the Reality questions ids
    function getQuestionsIds() external view returns (bytes32[] memory) {
        return realityParams.questionsIds;
    }

    /// @dev Multi scalar markets have two or more questions, the other market types have 1
    /// @return Array of question ids.
    function questionsIds(uint256 index) external view returns (bytes32) {
        return realityParams.questionsIds[index];
    }

    /// @dev Encoded questions parameters, needed to create and reopen a question
    function encodedQuestions(
        uint256 index
    ) external view returns (string memory) {
        return realityParams.encodedQuestions[index];
    }

    /// @dev Conditional Tokens questionId
    function questionId() external view returns (bytes32) {
        return conditionalTokensParams.questionId;
    }

    /// @dev Conditional Tokens conditionId
    function conditionId() external view returns (bytes32) {
        return conditionalTokensParams.conditionId;
    }

    /// @dev Conditional Tokens parentCollectionId
    function parentCollectionId() external view returns (bytes32) {
        return conditionalTokensParams.parentCollectionId;
    }

    /// @dev The parent market (optional). This market redeems to an outcome token of the parent market.
    function parentMarket() external view returns (address) {
        return conditionalTokensParams.parentMarket;
    }

    /// @dev The parent outcome (optional). The parent market's outcome token this market redeems for.
    function parentOutcome() external view returns (uint256) {
        return conditionalTokensParams.parentOutcome;
    }

    /// @dev Multi Scalar markets have one question for each outcome, while any other market has only one question.
    /// @return questionsCount The number of Reality questions of this market
    function getQuestionsCount() external view returns (uint256) {
        return realityParams.questionsIds.length;
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
