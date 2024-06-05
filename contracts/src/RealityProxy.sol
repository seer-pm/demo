// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConditionalTokens, IRealityETH_v3_0} from "./Interfaces.sol";
import "./Market.sol";

contract RealityProxy {
    IConditionalTokens public conditionalTokens;
    IRealityETH_v3_0 public realitio;

    bytes32 constant INVALID_RESULT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    uint256 internal constant REALITY_BINARY_TEMPLATE = 0;
    uint256 internal constant REALITY_UINT_TEMPLATE = 1;
    uint256 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2;
    uint256 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3;

    constructor(
        IConditionalTokens _conditionalTokens,
        IRealityETH_v3_0 _realitio
    ) {
        conditionalTokens = _conditionalTokens;
        realitio = _realitio;
    }

    function resolve(Market market) external {
        uint256 templateId = market.templateId();

        if (
            templateId == REALITY_BINARY_TEMPLATE ||
            templateId == REALITY_SINGLE_SELECT_TEMPLATE
        ) {
            resolveCategoricalMarket(market);
            return;
        }

        if (templateId == REALITY_MULTI_SELECT_TEMPLATE) {
            resolveMultiCategoricalMarket(market);
            return;
        }

        if (market.getQuestionsCount() > 1) {
            resolveMultiScalarMarket(market);
            return;
        }

        resolveScalarMarket(market);
    }

    function resolveCategoricalMarket(Market market) internal {
        bytes32 questionId = market.questionId();
        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes + 1);

        if (answer == uint256(INVALID_RESULT) || answer >= numOutcomes) {
            // the last outcome is INVALID_RESULT
            payouts[numOutcomes] = 1;
        } else {
            payouts[answer] = 1;
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    function resolveMultiCategoricalMarket(Market market) internal {
        bytes32 questionId = market.questionId();
        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes + 1);

        if (answer == uint256(INVALID_RESULT)) {
            // the last outcome is INVALID_RESULT
            payouts[numOutcomes] = 1;
        } else {
            bool allZeroes = true;

            for (uint i = 0; i < numOutcomes; i++) {
                payouts[i] = isBitSet(answer, i) ? 1 : 0;
                allZeroes = allZeroes && payouts[i] == 0;
            }

            if (allZeroes) {
                // invalid result
                payouts[numOutcomes] = 1;
            }
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    function resolveScalarMarket(Market market) internal {
        bytes32 questionId = market.questionId();
        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));
        uint256[] memory payouts = new uint256[](3);

        uint256 low = market.lowerBound();
        uint256 high = market.upperBound();

        if (answer == uint256(INVALID_RESULT)) {
            // the last outcome is INVALID_RESULT
            payouts[2] = 1;
        } else if (answer <= low) {
            payouts[0] = 1;
        } else if (answer >= high) {
            payouts[1] = 1;
        } else {
            payouts[0] = high - answer;
            payouts[1] = answer - low;
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    function resolveMultiScalarMarket(Market market) internal {
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes + 1);

        bool allZeroesOrInvalid = true;

        uint256 maxPayout = 1e10;

        uint256 invalidResultIndex = numOutcomes;

        for (uint i = 0; i < numOutcomes; i++) {
            payouts[i] = uint256(
                realitio.resultForOnceSettled(market.questionsIds(i))
            );

            if (payouts[i] == uint256(INVALID_RESULT)) {
                payouts[i] = 0;
            } else if (payouts[i] > maxPayout) {
                payouts[i] = maxPayout;
            }

            allZeroesOrInvalid = allZeroesOrInvalid && payouts[i] == 0;
        }

        if (allZeroesOrInvalid) {
            // invalid result
            for (uint i = 0; i < payouts.length; i++) {
                payouts[i] = i == invalidResultIndex ? 1 : 0;
            }
        }

        conditionalTokens.reportPayouts(market.questionId(), payouts);
    }

    function isBitSet(uint256 b, uint256 pos) public pure returns (bool) {
        return ((b >> pos) & 1) == 1;
    }
}
