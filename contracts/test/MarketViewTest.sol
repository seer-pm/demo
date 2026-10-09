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

    function test_marketViewBaseCollateral() public {
        MarketView marketView = new MarketView();
        IMarketFactory factory = IMarketFactory(address(marketFactory));

        Market parent = getCategoricalMarket(MIN_BOND, 2);
        Market child = getCategoricalMarket(MIN_BOND, 3, 0, address(parent));
        Market grandchild = getCategoricalMarket(MIN_BOND, 2, 1, address(child));

        MarketView.MarketInfo memory parentInfo = marketView.getMarket(factory, parent);
        assertEq(parentInfo.collateralToken, collateralToken);
        assertEq(parentInfo.baseCollateralToken, collateralToken);

        // a conditional market is entered with the parent outcome token but settles in the root collateral
        MarketView.MarketInfo memory childInfo = marketView.getMarket(factory, child);
        (IERC20 parentWrapped,) = parent.wrappedOutcome(0);
        assertEq(childInfo.collateralToken, address(parentWrapped));
        assertEq(childInfo.baseCollateralToken, collateralToken);

        MarketView.MarketInfo memory grandchildInfo = marketView.getMarket(factory, grandchild);
        (IERC20 childWrapped,) = child.wrappedOutcome(1);
        assertEq(grandchildInfo.collateralToken, address(childWrapped));
        assertEq(grandchildInfo.baseCollateralToken, collateralToken);

        // a market from a fixed-collateral factory does not store its collateral: the factory answers
        IMarketFactory factoryV1 = IMarketFactory(0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1);
        Market marketV1 = Market(factoryV1.allMarkets()[0]);
        MarketView.MarketInfo memory v1Info = marketView.getMarket(factoryV1, marketV1);
        assertEq(v1Info.collateralToken, factoryV1.collateralToken());
        assertEq(v1Info.baseCollateralToken, factoryV1.collateralToken());
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
        vm.warp(block.timestamp + QUESTION_TIMEOUT + 1);

        bytes32 reopenedQuestionId = IRealityReopen(realitio)
            .reopenQuestion(
                market.templateId(),
                market.encodedQuestions(0),
                arbitrator,
                QUESTION_TIMEOUT,
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
