pragma solidity 0.8.20;

import "../src/FutarchyFactory.sol";
import "../src/FutarchyProposal.sol";
import "../src/FutarchyRealityProxy.sol";
import "../src/FutarchyRouter.sol";
import "../src/Market.sol";
import {IMarketFactory, MarketView} from "../src/MarketView.sol";
import "forge-std/Test.sol";
import "solmate/src/utils/LibString.sol";

contract FutarchyFactoryTest is Test {
    uint256 constant MAX_SPLIT_AMOUNT = 100_000_000 ether;

    using LibString for uint256;

    FutarchyFactory futarchyFactory;

    FutarchyRouter futarchyRouter;

    // gnosis addresses
    address internal arbitrator = address(0xe40DD83a262da3f56976038F1554Fe541Fa75ecd);
    address internal realitio = address(0xE78996A233895bE74a66F451f1019cA9734205cc);
    address internal conditionalTokens = address(0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce);
    IERC20 internal collateralToken1 = IERC20(0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb);
    IERC20 internal collateralToken2 = IERC20(0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1);
    address internal wrapped1155Factory = address(0xD194319D1804C1051DD21Ba1Dc931cA72410B79f);

    uint256 constant MIN_BOND = 5 ether;

    bytes32 constant INVALID_RESULT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    bytes32 constant ANSWERED_TOO_SOON = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe;
    bytes32 constant PROPOSAL_APPROVED = bytes32(uint256(0));
    bytes32 constant PROPOSAL_REJECTED = bytes32(uint256(1));

    uint8 internal constant OUTCOMES_COUNT = 4;

    function setUp() public {
        uint256 forkId = vm.createFork("https://rpc.gnosischain.com");
        vm.selectFork(forkId);

        FutarchyProposal proposal = new FutarchyProposal();

        FutarchyRealityProxy realityProxy =
            new FutarchyRealityProxy(IConditionalTokens(conditionalTokens), IRealityETH_v3_0(realitio));

        futarchyFactory = new FutarchyFactory(
            address(proposal),
            arbitrator,
            IRealityETH_v3_0(realitio),
            IWrapped1155Factory(wrapped1155Factory),
            IConditionalTokens(conditionalTokens),
            realityProxy,
            1.5 days
        );

        futarchyRouter =
            new FutarchyRouter(IConditionalTokens(conditionalTokens), IWrapped1155Factory(wrapped1155Factory));
    }

    function getProposal(uint256 minBond)
        //uint256 parentOutcome,
        //address parentProposal
        public
        returns (FutarchyProposal)
    {
        FutarchyProposal market = FutarchyProposal(
            futarchyFactory.createProposal(
                FutarchyFactory.CreateProposalParams({
                    marketName: "Will proposal 'Use Seer Futarchy for Governance' be accepted by 2024-12-12 00:00:00?",
                    collateralToken1: collateralToken1,
                    collateralToken2: collateralToken2,
                    //parentOutcome: parentOutcome,
                    //parentMarket: parentProposal,
                    category: "technology",
                    lang: "en_US",
                    minBond: minBond,
                    openingTime: uint32(block.timestamp) + 60
                })
            )
        );

        return market;
    }

    function prepareProposal(
        bytes32 answer,
        uint256 amountSplit1,
        uint256 amountSplit2
    ) public returns (FutarchyProposal proposal) {
        vm.assume(answer != ANSWERED_TOO_SOON);

        proposal = getProposal(MIN_BOND);
        skip(60); // skip opening timestamp

        submitAnswer(proposal.questionId(), answer);

        skip(60 * 60 * 24 * 2); // question timeout

        proposal.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(proposal, amountSplit1, amountSplit2);

        vm.stopPrank();

        return proposal;
    }

    function splitMergeAndRedeem(FutarchyProposal proposal, uint256 amountSplit1, uint256 amountSplit2) public {
        IERC20(collateralToken1).approve(address(futarchyRouter), amountSplit1);
        IERC20(collateralToken2).approve(address(futarchyRouter), amountSplit2);

        // split
        if (amountSplit1 > 0) {
            // split collateralToken1
            deal(address(collateralToken1), address(msg.sender), amountSplit1);
            futarchyRouter.splitPosition(proposal, proposal.collateralToken1(), amountSplit1);
        }

        if (amountSplit2 > 0) {
            // split collateralToken2
            deal(address(collateralToken2), address(msg.sender), amountSplit2);
            futarchyRouter.splitPosition(proposal, proposal.collateralToken2(), amountSplit2);
        }

        // merge half
        uint256 halfAmount1 = amountSplit1 / 2;
        uint256 halfAmount2 = amountSplit2 / 2;
        approveWrappedTokens(address(futarchyRouter), proposal, halfAmount1, halfAmount2);
        if (amountSplit1 > 0) {
            // merge collateralToken1
            futarchyRouter.mergePositions(proposal, proposal.collateralToken1(), halfAmount1);
        }

        if (amountSplit2 > 0) {
            // merge collateralToken2
            futarchyRouter.mergePositions(proposal, proposal.collateralToken2(), halfAmount2);
        }

        // redeem half
        approveWrappedTokens(address(futarchyRouter), proposal, halfAmount1, halfAmount2);

        futarchyRouter.redeemProposal(proposal, amountSplit1 > 0 ? halfAmount1 : 0, amountSplit2 > 0 ? halfAmount2 : 0);
    }

    function approveWrappedTokens(
        address spender,
        FutarchyProposal proposal,
        uint256 amount1,
        uint256 amount2
    ) public {
        IERC20 wrapped1155;
        (wrapped1155,) = proposal.wrappedOutcome(0);
        wrapped1155.approve(spender, amount1);
        (wrapped1155,) = proposal.wrappedOutcome(1);
        wrapped1155.approve(spender, amount1);
        (wrapped1155,) = proposal.wrappedOutcome(2);
        wrapped1155.approve(spender, amount2);
        (wrapped1155,) = proposal.wrappedOutcome(3);
        wrapped1155.approve(spender, amount2);
    }

    function assertCollateralBalances(address owner, IERC20 collateral, uint256 amount) public {
        assertEq(collateral.balanceOf(owner), amount);
    }

    function test_AcceptedRedeemsYes1() public {
        prepareProposal(PROPOSAL_APPROVED, 10 ether, 0);

        assertCollateralBalances(msg.sender, collateralToken1, 10 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 0 ether);
    }

    function test_AcceptedRedeemsYes2() public {
        prepareProposal(PROPOSAL_APPROVED, 0, 10 ether);

        assertCollateralBalances(msg.sender, collateralToken1, 0 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 10 ether);
    }

    function test_redeemYes1Yes2() public {
        prepareProposal(PROPOSAL_APPROVED, 10 ether, 10 ether);

        assertCollateralBalances(msg.sender, collateralToken1, 10 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 10 ether);
    }

    function test_RejectedRedeemsNo1() public {
        prepareProposal(PROPOSAL_REJECTED, 10 ether, 0);

        assertCollateralBalances(msg.sender, collateralToken1, 10 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 0 ether);
    }

    function test_RejectedRedeemsNo2() public {
        prepareProposal(PROPOSAL_REJECTED, 0, 10 ether);

        assertCollateralBalances(msg.sender, collateralToken1, 0 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 10 ether);
    }

    function test_RejectedRedeemsNo1No2() public {
        prepareProposal(PROPOSAL_REJECTED, 10 ether, 10 ether);

        assertCollateralBalances(msg.sender, collateralToken1, 10 ether);
        assertCollateralBalances(msg.sender, collateralToken2, 10 ether);
    }

    function submitAnswer(bytes32 questionId, bytes32 answer) public {
        IRealityETH_v3_0(realitio).submitAnswer{value: MIN_BOND}(questionId, answer, 0);
    }

    function test_marketView() public {
        FutarchyProposal proposal = getProposal(MIN_BOND);

        MarketView marketView = new MarketView();

        MarketView.MarketInfo memory marketInfo =
            marketView.getMarket(IMarketFactory(address(futarchyFactory)), Market(address(proposal)));
        assertEq(marketInfo.marketName, proposal.marketName());
        assertEq(marketInfo.outcomes.length, 4);
        assertEq(marketInfo.wrappedTokens.length, 4);

        assertEq(marketView.getMarkets(1, IMarketFactory(address(futarchyFactory))).length, 1);
    }
}
