// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IERC20} from "./Interfaces.sol";
import {Market} from "./Market.sol";

interface IConditionalTokens {
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) external view returns (bytes32);

    function getPositionId(address collateralToken, bytes32 collectionId) external pure returns (uint256);

    function getOutcomeSlotCount(bytes32 conditionId) external view returns (uint256);

    function payoutDenominator(bytes32 conditionId) external view returns (uint256);

    function payoutNumerators(bytes32 conditionId, uint256 index) external view returns (uint256);
}

interface IMarketFactory {
    function allMarkets() external view returns (address[] memory);

    function conditionalTokens() external view returns (IConditionalTokens);

    function realitio() external view returns (IRealityETH_v3_0);

    function collateralToken() external view returns (address);
}

interface IRealityETH_v3_0 {
    struct Question {
        bytes32 content_hash;
        address arbitrator;
        uint32 opening_ts;
        uint32 timeout;
        uint32 finalize_ts;
        bool is_pending_arbitration;
        uint256 bounty;
        bytes32 best_answer;
        bytes32 history_hash;
        uint256 bond;
        uint256 min_bond;
    }

    function questions(bytes32 question_id) external view returns (Question memory);

    function isFinalized(bytes32 question_id) external view returns (bool);

    function isSettledTooSoon(bytes32 question_id) external view returns (bool);

    function reopened_questions(bytes32 question_id) external view returns (bytes32);
}

/// @dev Contract used as a frontend helper. It doesn't have any state-changing function.
contract MarketView {
    struct ParentMarketInfo {
        address id;
        string marketName;
        string[] outcomes;
        address[] wrappedTokens;
        bytes32 conditionId;
        bool payoutReported;
        uint256[] payoutNumerators;
    }

    struct MarketInfo {
        address id;
        string marketName;
        string[] outcomes;
        ParentMarketInfo parentMarket;
        uint256 parentOutcome;
        address[] wrappedTokens;
        uint256 outcomesSupply;
        uint256 lowerBound;
        uint256 upperBound;
        bytes32 parentCollectionId;
        bytes32 conditionId;
        bytes32 questionId;
        uint256 templateId;
        IRealityETH_v3_0.Question[] questions;
        bytes32[] questionsIds;
        string[] encodedQuestions;
        bool payoutReported;
        uint256[] payoutNumerators;
    }

    function getMarket(IMarketFactory marketFactory, Market market) public view returns (MarketInfo memory) {
        bytes32 conditionId = market.conditionId();

        IConditionalTokens conditionalTokens = marketFactory.conditionalTokens();

        (string[] memory outcomes, address[] memory wrappedTokens) =
            getOutcomesAndTokens(conditionalTokens, market, conditionId);

        (IRealityETH_v3_0.Question[] memory questions, string[] memory encodedQuestions, bytes32[] memory questionsIds)
        = getQuestions(market, marketFactory);

        return MarketInfo({
            id: address(market),
            marketName: market.marketName(),
            outcomes: outcomes,
            parentMarket: getParentMarketInfo(market, marketFactory.conditionalTokens()),
            parentOutcome: market.parentOutcome(),
            wrappedTokens: wrappedTokens,
            outcomesSupply: IERC20(wrappedTokens[0]).totalSupply(),
            lowerBound: market.lowerBound(),
            upperBound: market.upperBound(),
            parentCollectionId: market.parentCollectionId(),
            conditionId: conditionId,
            questionId: market.questionId(),
            templateId: market.templateId(),
            questions: questions,
            questionsIds: questionsIds,
            encodedQuestions: encodedQuestions,
            payoutReported: conditionalTokens.payoutDenominator(conditionId) > 0,
            payoutNumerators: getPayoutNumerators(conditionalTokens, market.conditionId())
        });
    }

    function getParentMarketInfo(
        Market market,
        IConditionalTokens conditionalTokens
    ) internal view returns (ParentMarketInfo memory) {
        if (market.parentMarket() == address(0)) {
            return ParentMarketInfo({
                id: address(0),
                marketName: "",
                outcomes: new string[](0),
                wrappedTokens: new address[](0),
                conditionId: 0,
                payoutReported: false,
                payoutNumerators: new uint256[](0)
            });
        }

        Market parentMarket = Market(market.parentMarket());

        (string[] memory outcomes, address[] memory wrappedTokens) =
            getOutcomesAndTokens(conditionalTokens, parentMarket, market.conditionId());

        return ParentMarketInfo({
            id: market.parentMarket(),
            marketName: parentMarket.marketName(),
            outcomes: outcomes,
            wrappedTokens: wrappedTokens,
            conditionId: parentMarket.conditionId(),
            payoutReported: conditionalTokens.payoutDenominator(parentMarket.conditionId()) > 0,
            payoutNumerators: getPayoutNumerators(conditionalTokens, parentMarket.conditionId())
        });
    }

    function getPayoutNumerators(
        IConditionalTokens conditionalTokens,
        bytes32 conditionId
    ) internal view returns (uint256[] memory payoutNumerators) {
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(conditionId);

        payoutNumerators = new uint256[](outcomeSlotCount);

        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            payoutNumerators[i] = conditionalTokens.payoutNumerators(conditionId, i);
        }

        return payoutNumerators;
    }

    function getOutcomesAndTokens(
        IConditionalTokens conditionalTokens,
        Market market,
        bytes32 conditionId
    ) internal view returns (string[] memory outcomes, address[] memory wrappedTokens) {
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(conditionId);

        outcomes = new string[](outcomeSlotCount);

        wrappedTokens = new address[](outcomeSlotCount);

        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            outcomes[i] = i == (outcomeSlotCount - 1) ? "Invalid result" : market.outcomes(i);

            (IERC20 wrapped1155,) = market.wrappedOutcome(i);
            wrappedTokens[i] = address(wrapped1155);
        }

        return (outcomes, wrappedTokens);
    }

    function getQuestions(
        Market market,
        IMarketFactory marketFactory
    )
        internal
        view
        returns (
            IRealityETH_v3_0.Question[] memory questions,
            string[] memory encodedQuestions,
            bytes32[] memory questionsIds
        )
    {
        bytes32[] memory initialQuestionsIds = market.questionsIds();
        questions = new IRealityETH_v3_0.Question[](initialQuestionsIds.length);
        encodedQuestions = new string[](questions.length);
        questionsIds = new bytes32[](questions.length);
        {
            IRealityETH_v3_0 realitio = marketFactory.realitio();
            for (uint256 i = 0; i < questions.length; i++) {
                questionsIds[i] = getQuestionId(initialQuestionsIds[i], realitio);
                questions[i] = realitio.questions(questionsIds[i]);
                encodedQuestions[i] = market.encodedQuestions(i);
            }
        }

        return (questions, encodedQuestions, questionsIds);
    }

    function getMarkets(uint256 count, IMarketFactory marketFactory) external view returns (MarketInfo[] memory) {
        address[] memory allMarkets = marketFactory.allMarkets();

        MarketInfo[] memory marketsInfo = new MarketInfo[](count);

        if (allMarkets.length == 0) {
            return marketsInfo;
        }

        uint256 lastIndex = allMarkets.length - 1;
        uint256 startIndex = allMarkets.length > count ? allMarkets.length - count : 0;
        uint256 currentIndex = 0;

        for (uint256 j = lastIndex; j >= startIndex; j--) {
            marketsInfo[currentIndex++] = getMarket(marketFactory, Market(allMarkets[j]));

            if (j == 0) {
                break;
            }
        }

        return marketsInfo;
    }

    function getQuestionId(bytes32 questionId, IRealityETH_v3_0 realitio) public view returns (bytes32) {
        if (realitio.isFinalized(questionId) && realitio.isSettledTooSoon(questionId)) {
            bytes32 replacementId = realitio.reopened_questions(questionId);
            if (replacementId != bytes32(0)) {
                questionId = replacementId;
            }
        }
        return questionId;
    }
}
