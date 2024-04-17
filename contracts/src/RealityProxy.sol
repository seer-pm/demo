// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConditionalTokens, IRealityETH_v3_0} from "./Interfaces.sol";
import "./Market.sol";

contract RealityProxy {
    IConditionalTokens public conditionalTokens;
    IRealityETH_v3_0 public realitio;

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
        uint256[] memory payouts = getSingleSelectPayouts(
            questionId,
            market.numOutcomes()
        );

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    function resolveMultiCategoricalMarket(Market market) internal {
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes);

        uint256 result = uint256(
            realitio.resultForOnceSettled(market.questionId())
        );

        for (uint i = 0; i < numOutcomes; i++) {
            payouts[i] = isBitSet(result, i) ? 1 : 0;
        }

        conditionalTokens.reportPayouts(market.questionId(), payouts);
    }

    function resolveScalarMarket(Market market) internal {
        uint256 low = market.lowerBound();
        uint256 high = market.upperBound();

        uint256[] memory payouts = new uint256[](2);

        bytes32 questionId = market.questionId();

        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));

        if (answer == type(uint256).max) {
            payouts[0] = 1;
            payouts[1] = 1;
        } else if (answer <= low) {
            payouts[0] = 1;
            payouts[1] = 0;
        } else if (answer >= high) {
            payouts[0] = 0;
            payouts[1] = 1;
        } else {
            payouts[0] = high - answer;
            payouts[1] = answer - low;
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    function resolveMultiScalarMarket(Market market) internal {
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes);

        for (uint i = 0; i < numOutcomes; i++) {
            payouts[i] = uint256(
                realitio.resultForOnceSettled(market.questionsIds(i))
            );
        }

        conditionalTokens.reportPayouts(market.questionId(), payouts);
    }

    function getSingleSelectPayouts(
        bytes32 questionId,
        uint256 numOutcomes
    ) internal view returns (uint256[] memory) {
        uint256[] memory payouts = new uint256[](numOutcomes);

        uint256 answer = uint256(realitio.resultForOnceSettled(questionId));

        if (answer == type(uint256).max) {
            for (uint256 i = 0; i < numOutcomes; i++) {
                payouts[i] = 1;
            }
        } else {
            require(
                answer < numOutcomes,
                "Answer must be between 0 and numOutcomes"
            );
            payouts[answer] = 1;
        }

        return payouts;
    }

    function isBitSet(uint256 b, uint256 pos) public pure returns (bool) {
        return ((b >> pos) & 1) == 1;
    }
}
