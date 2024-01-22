// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IRealityProxy} from "./Interfaces.sol";

contract Market {
    bool public initialized;

    string marketName;
    string[] outcomes;
    bytes32 public conditionId;
    bytes32 public questionId;
    uint256 templateId;
    string encodedQuestion;
    IRealityProxy oracle;

    event QuestionsRegistered(bytes32 _questionId);

    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        bytes32 _conditionId,
        bytes32 _questionId,
        uint256 _templateId,
        string memory _qencodedQuestion,
        IRealityProxy _oracle
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        conditionId = _conditionId;
        questionId = _questionId;
        templateId = _templateId;
        encodedQuestion = _qencodedQuestion;
        oracle = _oracle;

        initialized = true;
        emit QuestionsRegistered(questionId);
    }

    function resolve() external {
        oracle.resolve(
            questionId,
            templateId,
            encodedQuestion,
            outcomes.length
        );
    }
}
