// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./RealityProxy.sol";

contract Market {
    bool public initialized;

    string public marketName;
    string[] public outcomes;
    uint256 public lowerBound;
    uint256 public upperBound;
    bytes32 public conditionId;
    bytes32 public questionId; // conditional tokens questionId
    bytes32[] public questionsIds; // reality questionId's
    uint256 public templateId;
    string[] public encodedQuestions;
    RealityProxy public realityProxy;

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
        if (questionsIds.length > 1) {
            realityProxy.resolveMultiScalarMarket(this);

            return;
        }

        if (lowerBound == 0 && upperBound == 0) {
            realityProxy.resolveCategoricalMarket(this);

            return;
        }

        realityProxy.resolveScalarMarket(this);
    }
}
