pragma solidity 0.8.20;

import "../src/Market.sol";
import {IMarketFactory, MarketView} from "../src/MarketView.sol";
import "./BaseTest.sol";
import "forge-std/Test.sol";

import "forge-std/console.sol";

interface IRealityReopen {
    function reopenQuestion(
        uint256 template_id,
        string memory question,
        address arbitrator,
        uint32 timeout,
        uint32 opening_ts,
        uint256 nonce,
        uint256 min_bond,
        bytes32 reopens_question_id
    ) external payable returns (bytes32);
}

contract MarketViewTest is BaseTest {
    function test_marketView() public {
        Market categoricalMarket = getCategoricalMarket(MIN_BOND, 10);
        Market scalarMarket = getScalarMarket(MIN_BOND, 2, 0, address(categoricalMarket));

        MarketView marketView = new MarketView();

        MarketView.MarketInfo memory marketInfo =
            marketView.getMarket(IMarketFactory(address(marketFactory)), categoricalMarket);
        assertEq(marketInfo.marketName, categoricalMarket.marketName());

        marketInfo = marketView.getMarket(IMarketFactory(address(marketFactory)), scalarMarket);
        assertEq(marketInfo.marketName, scalarMarket.marketName());

        assertEq(marketView.getMarkets(2, IMarketFactory(address(marketFactory))).length, 2);
    }

    function test_marketViewParentOutcomes() public {
        MarketView marketView = new MarketView();

        // the parent info is sized by the parent's condition, whatever the child's outcome count is
        assertParentOutcomes(marketView, 3, 10);
        assertParentOutcomes(marketView, 10, 2);
    }

    function assertParentOutcomes(MarketView marketView, uint256 parentNumOutcomes, uint256 childNumOutcomes) internal {
        Market parentMarket = getCategoricalMarket(MIN_BOND, parentNumOutcomes);
        Market childMarket = getCategoricalMarket(MIN_BOND, childNumOutcomes, 0, address(parentMarket));

        MarketView.MarketInfo memory marketInfo =
            marketView.getMarket(IMarketFactory(address(marketFactory)), childMarket);
        MarketView.ParentMarketInfo memory parentInfo = marketInfo.parentMarket;

        // one extra slot for the INVALID_RESULT outcome
        assertEq(parentInfo.outcomes.length, parentNumOutcomes + 1);
        assertEq(parentInfo.wrappedTokens.length, parentNumOutcomes + 1);
        assertEq(parentInfo.outcomes[parentNumOutcomes], "Invalid result");

        for (uint256 i = 0; i <= parentNumOutcomes; i++) {
            if (i < parentNumOutcomes) {
                assertEq(parentInfo.outcomes[i], parentMarket.outcomes(i));
            }

            (IERC20 wrapped1155,) = parentMarket.wrappedOutcome(i);
            assertEq(parentInfo.wrappedTokens[i], address(wrapped1155));
        }
    }

    function test_marketViewBaseQuestionsIds() public {
        Market market = getCategoricalMarket(MIN_BOND, 2);
        MarketView marketView = new MarketView();
        bytes32 originalQuestionId = market.questionsIds()[0];

        MarketView.MarketInfo memory marketInfo = marketView.getMarket(IMarketFactory(address(marketFactory)), market);
        assertEq(marketInfo.baseQuestionsIds.length, 1);
        assertEq(marketInfo.baseQuestionsIds[0], originalQuestionId);
        assertEq(marketInfo.questionsIds[0], originalQuestionId);

        // answer too soon and wait until the question is finalized
        vm.warp(marketInfo.questions[0].opening_ts + 1);
        submitAnswer(originalQuestionId, ANSWERED_TOO_SOON);
        vm.warp(block.timestamp + marketFactory.questionTimeout() + 1);

        bytes32 reopenedQuestionId = IRealityReopen(realitio)
            .reopenQuestion(
                market.templateId(),
                market.encodedQuestions(0),
                arbitrator,
                marketFactory.questionTimeout(),
                marketInfo.questions[0].opening_ts,
                1,
                MIN_BOND,
                originalQuestionId
            );
        assertNotEq(reopenedQuestionId, originalQuestionId);

        marketInfo = marketView.getMarket(IMarketFactory(address(marketFactory)), market);
        // questionsIds points to the reopened question, baseQuestionsIds keeps the original one
        assertEq(marketInfo.questionsIds[0], reopenedQuestionId);
        assertEq(marketInfo.baseQuestionsIds[0], originalQuestionId);
    }
}
