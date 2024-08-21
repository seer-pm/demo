// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Market} from "./Market.sol";

interface IConditionalTokens {
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint indexSet
    ) external view returns (bytes32);

    function getPositionId(
        address collateralToken,
        bytes32 collectionId
    ) external pure returns (uint);

    function getOutcomeSlotCount(
        bytes32 conditionId
    ) external view returns (uint);

    function payoutDenominator(
        bytes32 conditionId
    ) external view returns (uint);
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

    function questions(
        bytes32 question_id
    ) external view returns (Question memory);

    function isFinalized(bytes32 question_id) external view returns (bool);

    function isSettledTooSoon(bytes32 question_id) external view returns (bool);

    function reopened_questions(
        bytes32 question_id
    ) external view returns (bytes32);
}

contract MarketView {
    struct MarketInfo {
        address id;
        string marketName;
        string[] outcomes;
        address[] wrappedTokens;
        uint256 outcomesSupply;
        uint256 lowerBound;
        uint256 upperBound;
        bytes32 conditionId;
        bytes32 questionId;
        uint256 templateId;
        IRealityETH_v3_0.Question[] questions;
        bytes32[] questionsIds;
        string[] encodedQuestions;
        bool payoutReported;
    }

    function getMarket(
        IMarketFactory marketFactory,
        Market market
    ) public view returns (MarketInfo memory) {
        bytes32 conditionId = market.conditionId();

        IConditionalTokens conditionalTokens = marketFactory
            .conditionalTokens();

        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(
            conditionId
        );

        string[] memory outcomes = new string[](outcomeSlotCount);
        address[] memory wrappedTokens = new address[](outcomeSlotCount);
        uint256 outcomesSupply = 0;

        for (uint256 i = 0; i < outcomeSlotCount; i++) {
            outcomes[i] = i == (outcomeSlotCount - 1)
                ? "Invalid result"
                : market.outcomes(i);
            wrappedTokens[i] = address(
                marketFactory.wrappedERC20Factory().tokens(
                    conditionalTokens.getPositionId(
                        marketFactory.collateralToken(),
                        conditionalTokens.getCollectionId(
                            bytes32(0),
                            conditionId,
                            1 << i
                        )
                    )
                )
            );

            if (i == 0) {
                outcomesSupply = IERC20(wrappedTokens[i]).totalSupply();
            }
        }

        IRealityETH_v3_0.Question[]
            memory questions = new IRealityETH_v3_0.Question[](
                market.getQuestionsCount()
            );
        string[] memory encodedQuestions = new string[](questions.length);
        bytes32[] memory questionsIds = new bytes32[](questions.length);
        {
            IRealityETH_v3_0 realitio = marketFactory.realitio();
            for (uint256 i = 0; i < questions.length; i++) {
                questionsIds[i] = getQuestionId(
                    market.questionsIds(i),
                    realitio
                );
                questions[i] = realitio.questions(questionsIds[i]);
                encodedQuestions[i] = market.encodedQuestions(i);
            }
        }

        return
            MarketInfo({
                id: address(market),
                marketName: market.marketName(),
                outcomes: outcomes,
                wrappedTokens: wrappedTokens,
                outcomesSupply: outcomesSupply,
                lowerBound: market.lowerBound(),
                upperBound: market.upperBound(),
                conditionId: conditionId,
                questionId: market.questionId(),
                templateId: market.templateId(),
                questions: questions,
                questionsIds: questionsIds,
                encodedQuestions: encodedQuestions,
                payoutReported: conditionalTokens.payoutDenominator(
                    conditionId
                ) > 0
            });
    }

    function getMarkets(
        uint256 count,
        IMarketFactory marketFactory
    ) external view returns (MarketInfo[] memory) {
        address[] memory allMarkets = marketFactory.allMarkets();

        MarketInfo[] memory marketsInfo = new MarketInfo[](count);

        if (allMarkets.length == 0) {
            return marketsInfo;
        }

        uint256 lastIndex = allMarkets.length - 1;
        uint256 startIndex = allMarkets.length > count
            ? allMarkets.length - count
            : 0;
        uint256 currentIndex = 0;

        for (uint256 j = lastIndex; j >= startIndex; j--) {
            marketsInfo[currentIndex++] = getMarket(
                marketFactory,
                Market(allMarkets[j])
            );

            if (j == 0) {
                break;
            }
        }

        return marketsInfo;
    }

    function getQuestionId(
        bytes32 questionId,
        IRealityETH_v3_0 realitio
    ) public view returns (bytes32) {
        if (
            realitio.isFinalized(questionId) &&
            realitio.isSettledTooSoon(questionId)
        ) {
            bytes32 replacementId = realitio.reopened_questions(questionId);
            if (replacementId != bytes32(0)) {
                questionId = replacementId;
            }
        }
        return questionId;
    }
}
