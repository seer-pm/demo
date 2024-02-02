// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IRealityProxy} from "./Interfaces.sol";

contract Market {
    bool public initialized;

    string public marketName;
    string[] public outcomes;
    bytes32 public conditionId;
    bytes32 public questionId;
    uint256 public templateId;
    string public encodedQuestion;
    IRealityProxy public oracle;
    address[] public pools;

    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        bytes32 _conditionId,
        bytes32 _questionId,
        uint256 _templateId,
        string memory _encodedQuestion,
        IRealityProxy _oracle,
        address[] memory _pools
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        conditionId = _conditionId;
        questionId = _questionId;
        templateId = _templateId;
        encodedQuestion = _encodedQuestion;
        oracle = _oracle;
        pools = _pools;

        initialized = true;
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
