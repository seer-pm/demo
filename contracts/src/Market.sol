// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IRealityProxy, IRealityScalarAdapter} from "./Interfaces.sol";

contract Market {
    bool public initialized;

    string public marketName;
    string[] public outcomes;
    uint256 public lowerBound;
    uint256 public upperBound;
    bytes32 public conditionId;
    bytes32 public questionId;
    uint256 public templateId;
    string public encodedQuestion;
    IRealityProxy public categoricalOracle;
    IRealityScalarAdapter public scalarOracle;
    address[] public pools;

    function initialize(
        string memory _marketName,
        string[] memory _outcomes,
        uint256 _lowerBound,
        uint256 _upperBound,
        bytes32 _conditionId,
        bytes32 _questionId,
        uint256 _templateId,
        string memory _encodedQuestion,
        IRealityProxy _categoricalOracle,
        IRealityScalarAdapter _scalarOracle,
        address[] memory _pools
    ) external {
        require(!initialized, "Already initialized.");

        marketName = _marketName;
        outcomes = _outcomes;
        lowerBound = _lowerBound;
        upperBound = _upperBound;
        conditionId = _conditionId;
        questionId = _questionId;
        templateId = _templateId;
        encodedQuestion = _encodedQuestion;
        categoricalOracle = _categoricalOracle;
        scalarOracle = _scalarOracle;
        pools = _pools;

        initialized = true;
    }

    function resolve() external {
        if (lowerBound == 0 && upperBound == 0) {
            categoricalOracle.resolve(
                questionId,
                templateId,
                encodedQuestion,
                outcomes.length
            );
        } else {
            scalarOracle.resolve(
                questionId,
                encodedQuestion,
                lowerBound,
                upperBound
            );
        }
    }
}
