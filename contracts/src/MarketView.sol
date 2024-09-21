// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

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
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
}

interface IWrappedERC20Factory {
    function tokens(uint256 tokenId) external view returns (IERC20 token);
}

interface IMarketFactory {
    function allMarkets() external view returns (address[] memory);

    function conditionalTokens() external view returns (IConditionalTokens);

    function realitio() external view returns (IRealityETH_v3_0);

    function wrappedERC20Factory() external view returns (IWrappedERC20Factory);

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

interface IMarketV1 {
    function questionsIds(uint256 index) external view returns (bytes32);

    function getQuestionsCount() external view returns (uint256);
}

/// @dev Contract used as a frontend helper. It doesn't have any state-changing function.
contract MarketView {
    struct MarketInfo {
        address id;
        string marketName;
        string[] outcomes;
        address parentMarket;
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
    }

    function getMarket(IMarketFactory marketFactory, Market market) public view returns (MarketInfo memory) {
        bytes32 conditionId = market.conditionId();

        IConditionalTokens conditionalTokens = marketFactory.conditionalTokens();

        (bytes32 parentCollectionId, address parentMarket, uint256 parentOutcome) = getParentParams(market);

        (string[] memory outcomes, address[] memory wrappedTokens) =
            getOutcomesAndTokens(marketFactory, conditionalTokens, market, conditionId, parentCollectionId);

        (IRealityETH_v3_0.Question[] memory questions, string[] memory encodedQuestions, bytes32[] memory questionsIds)
        = getQuestions(market, marketFactory);

        return MarketInfo({
            id: address(market),
            marketName: market.marketName(),
            outcomes: outcomes,
            parentMarket: parentMarket,
            parentOutcome: parentOutcome,
            wrappedTokens: wrappedTokens,
            outcomesSupply: IERC20(wrappedTokens[0]).totalSupply(),
            lowerBound: market.lowerBound(),
            upperBound: market.upperBound(),
            parentCollectionId: parentCollectionId,
            conditionId: conditionId,
            questionId: market.questionId(),
            templateId: market.templateId(),
            questions: questions,
            questionsIds: questionsIds,
            encodedQuestions: encodedQuestions,
            payoutReported: conditionalTokens.payoutDenominator(conditionId) > 0
        });
    }

    function getOutcomesAndTokens(
        IMarketFactory marketFactory,
        IConditionalTokens conditionalTokens,
        Market market,
        bytes32 conditionId,
        bytes32 parentCollectionId
    ) internal view returns (string[] memory outcomes, address[] memory wrappedTokens) {
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(conditionId);

        outcomes = new string[](outcomeSlotCount);

        wrappedTokens = new address[](outcomeSlotCount);

        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            outcomes[i] = i == (outcomeSlotCount - 1) ? "Invalid result" : market.outcomes(i);

            wrappedTokens[i] = address(
                marketFactory.wrappedERC20Factory().tokens(
                    conditionalTokens.getPositionId(
                        marketFactory.collateralToken(),
                        conditionalTokens.getCollectionId(parentCollectionId, conditionId, 1 << i)
                    )
                )
            );
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
        bytes32[] memory initialQuestionsIds = getQuestionsIds(market);
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

    /// @dev Function to maintain backward compatibility with existing markets that don't support conditional markets.
    /// It can be removed when the old MarketFactory is no longer used.
    function getParentParams(Market market)
        internal
        view
        returns (bytes32 parentCollectionId, address parentMarket, uint256 parentOutcome)
    {
        try market.parentCollectionId() returns (bytes32 _parentCollectionId) {
            return (_parentCollectionId, market.parentMarket(), market.parentOutcome());
        } catch {
            return (bytes32(0), address(0), 0);
        }
    }

    /// @dev Function to maintain backward compatibility with existing markets.
    /// It can be removed when the old MarketFactory is no longer used.
    function getQuestionsIds(Market market) internal view returns (bytes32[] memory) {
        try market.questionsIds() returns (bytes32[] memory questionsIds) {
            return questionsIds;
        } catch {
            uint256 questionsCount = IMarketV1(address(market)).getQuestionsCount();
            bytes32[] memory questionsIds = new bytes32[](questionsCount);
            for (uint256 i = 0; i < questionsCount; i++) {
                questionsIds[i] = IMarketV1(address(market)).questionsIds(i);
            }
            return questionsIds;
        }
    }
}
