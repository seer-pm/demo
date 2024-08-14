/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConditionalTokens, IRealityETH_v3_0} from "./Interfaces.sol";
import "./Market.sol";

contract RealityProxy {
    IConditionalTokens public immutable conditionalTokens; // Conditional Tokens contract
    IRealityETH_v3_0 public immutable realitio; // Reality.eth contract

    bytes32 constant INVALID_RESULT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff; // INVALID_RESULT reserved value

    uint256 internal constant REALITY_UINT_TEMPLATE = 1; // Template for scalar and multi scalar markets
    uint256 internal constant REALITY_SINGLE_SELECT_TEMPLATE = 2; // Template for categorical markets
    uint256 internal constant REALITY_MULTI_SELECT_TEMPLATE = 3; // Template for multi categorical markets

    /// @dev Constructor
    /// @param _conditionalTokens Conditional Tokens contract address
    /// @param _realitio Reality.eth contract address
    constructor(
        IConditionalTokens _conditionalTokens,
        IRealityETH_v3_0 _realitio
    ) {
        conditionalTokens = _conditionalTokens;
        realitio = _realitio;
    }

    /// @dev Resolves the specified market
    /// @param market Market to resolve
    function resolve(Market market) external {
        uint256 templateId = market.templateId();

        if (templateId == REALITY_SINGLE_SELECT_TEMPLATE) {
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

    /// @dev Resolves to invalid if the answer is invalid or the result is greater than the amount of outcomes
    /// @param market Market to resolve
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

    /// @dev Resolves to invalid if the answer is invalid or all the results are zero
    /// @param market Market to resolve
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
                payouts[i] = (answer >> i) & 1;
                allZeroes = allZeroes && payouts[i] == 0;
            }

            if (allZeroes) {
                // invalid result
                payouts[numOutcomes] = 1;
            }
        }

        conditionalTokens.reportPayouts(questionId, payouts);
    }

    /// @dev Resolves to invalid if the answer is invalid
    /// @param market Market to resolve
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

    /// @dev If any individual result is invalid then the corresponding payout element is set to 0
    /// @dev If all the elements of the payout vector are 0 or all are invalid, the market resolves to invalid
    /// @param market Market to resolve
    function resolveMultiScalarMarket(Market market) internal {
        uint256 numOutcomes = market.numOutcomes();
        uint256[] memory payouts = new uint256[](numOutcomes + 1);

        bool allZeroesOrInvalid = true;

        /*
         * We set maxPayout to a sufficiently large number for most possible outcomes that also avoids overflows in the following places:
         * https://github.com/gnosis/conditional-tokens-contracts/blob/master/contracts/ConditionalTokens.sol#L89
         * https://github.com/gnosis/conditional-tokens-contracts/blob/master/contracts/ConditionalTokens.sol#L242
         */
        uint256 maxPayout = 2 ** (256 / 2) - 1;

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
            payouts[numOutcomes] = 1;
        }

        conditionalTokens.reportPayouts(market.questionId(), payouts);
    }
}
