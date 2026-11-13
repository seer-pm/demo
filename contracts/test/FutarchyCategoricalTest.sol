pragma solidity 0.8.20;

import "../src/FutarchyCategoricalFactory.sol";
import "../src/FutarchyCategoricalRealityProxy.sol";
import "../src/FutarchyCategoricalRouter.sol";
import "../src/FutarchyProposal.sol";
import "forge-std/Test.sol";

interface IERC20Metadata {
    function symbol() external view returns (string memory);
}

contract FutarchyCategoricalTest is Test {
    FutarchyCategoricalFactory factory;
    FutarchyCategoricalRouter router;

    // gnosis addresses
    address internal arbitrator = address(0xe40DD83a262da3f56976038F1554Fe541Fa75ecd);
    address internal realitio = address(0xE78996A233895bE74a66F451f1019cA9734205cc);
    address internal conditionalTokens = address(0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce);
    IERC20 internal collateralToken1 = IERC20(0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb);
    IERC20 internal collateralToken2 = IERC20(0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1);
    address internal wrapped1155Factory = address(0xD194319D1804C1051DD21Ba1Dc931cA72410B79f);

    uint256 constant MIN_BOND = 5 ether;

    bytes32 constant INVALID_RESULT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    address internal user = makeAddr("user");

    function setUp() public {
        uint256 forkId = vm.createFork("https://rpc.gnosischain.com");
        vm.selectFork(forkId);

        FutarchyCategoricalRealityProxy realityProxy =
            new FutarchyCategoricalRealityProxy(IConditionalTokens(conditionalTokens), IRealityETH_v3_0(realitio));

        factory = new FutarchyCategoricalFactory(
            address(new FutarchyProposal()),
            arbitrator,
            IRealityETH_v3_0(realitio),
            IWrapped1155Factory(wrapped1155Factory),
            IConditionalTokens(conditionalTokens),
            realityProxy,
            1.5 days
        );

        router = new FutarchyCategoricalRouter(
            IConditionalTokens(conditionalTokens), IWrapped1155Factory(wrapped1155Factory)
        );
    }

    function createProposal(uint256 numOutcomes) internal returns (FutarchyProposal) {
        string[3] memory names = ["Candidate A", "Candidate B", "Candidate C"];
        string[3] memory prefixes = ["CAND_A", "CAND_B", "CAND_C"];

        string[] memory outcomes = new string[](numOutcomes);
        string[] memory tokenNames = new string[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            outcomes[i] = names[i];
            tokenNames[i] = prefixes[i];
        }

        return FutarchyProposal(
            factory.createProposal(
                FutarchyCategoricalFactory.CreateProposalParams({
                    marketName: "Who will win the presidential election?",
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    collateralToken1: collateralToken1,
                    collateralToken2: collateralToken2,
                    category: "politics",
                    lang: "en_US",
                    minBond: MIN_BOND,
                    openingTime: uint32(block.timestamp) + 60
                })
            )
        );
    }

    function resolve(FutarchyProposal proposal, bytes32 answer) internal {
        skip(60); // opening time
        IRealityETH_v3_0(realitio).submitAnswer{value: MIN_BOND}(proposal.questionId(), answer, 0);
        skip(2 days); // question timeout
        proposal.resolve();
    }

    function wrapped(FutarchyProposal proposal, uint256 index) internal view returns (IERC20 token) {
        (token,) = proposal.wrappedOutcome(index);
    }

    function symbol(IERC20 token) internal view returns (string memory) {
        return IERC20Metadata(address(token)).symbol();
    }

    /// Splits 10 of each collateral, merges 4 and redeems the remaining 6 winning tokens.
    function splitMergeAndRedeem(FutarchyProposal proposal) internal {
        uint256 numTokens = 2 * proposal.numOutcomes() + 2;

        deal(address(collateralToken1), user, 10 ether);
        deal(address(collateralToken2), user, 10 ether);

        vm.startPrank(user);
        collateralToken1.approve(address(router), 10 ether);
        collateralToken2.approve(address(router), 10 ether);
        router.splitPosition(proposal, collateralToken1, 10 ether);
        router.splitPosition(proposal, collateralToken2, 10 ether);

        for (uint256 i = 0; i < numTokens; i++) {
            wrapped(proposal, i).approve(address(router), type(uint256).max);
        }

        router.mergePositions(proposal, collateralToken1, 4 ether);
        router.mergePositions(proposal, collateralToken2, 4 ether);
        router.redeemProposal(proposal, 6 ether, 6 ether);
        vm.stopPrank();
    }

    /// After splitMergeAndRedeem: all collateral is back, the winning tokens were spent and every losing token is
    /// still held, worth nothing.
    function assertOnlySlotWon(FutarchyProposal proposal, uint256 winningSlot) internal {
        uint256 numOutcomes = proposal.numOutcomes();

        bool[] memory winners = router.getWinningOutcomes(proposal.conditionId());
        assertEq(winners.length, numOutcomes + 1);
        for (uint256 j = 0; j <= numOutcomes; j++) {
            assertEq(winners[j], j == winningSlot);
        }

        assertEq(collateralToken1.balanceOf(user), 10 ether);
        assertEq(collateralToken2.balanceOf(user), 10 ether);

        for (uint256 j = 0; j <= numOutcomes; j++) {
            uint256 expected = j == winningSlot ? 0 : 6 ether;
            assertEq(wrapped(proposal, router.getWrappedIndex(numOutcomes, true, j)).balanceOf(user), expected);
            assertEq(wrapped(proposal, router.getWrappedIndex(numOutcomes, false, j)).balanceOf(user), expected);
        }
    }

    function test_layout() public {
        FutarchyProposal proposal = createProposal(3);
        string memory symbol2 = IERC20Metadata(address(collateralToken2)).symbol();

        assertEq(proposal.numOutcomes(), 3);
        assertEq(proposal.outcomes(0), "Candidate A");
        assertEq(proposal.outcomes(2), "Candidate C");
        assertEq(IConditionalTokens(conditionalTokens).getOutcomeSlotCount(proposal.conditionId()), 4);
        assertEq(
            proposal.encodedQuestion(),
            string.concat(
                "Who will win the presidential election?",
                unicode"\u241f",
                "\"Candidate A\",\"Candidate B\",\"Candidate C\"",
                unicode"\u241f",
                "politics",
                unicode"\u241f",
                "en_US"
            )
        );

        // [answers of collateral1, answers of collateral2, INVALID of collateral1, INVALID of collateral2]
        string[8] memory expectedSymbols = [
            "CAND_A_GNO",
            "CAND_B_GNO",
            "CAND_C_GNO",
            string.concat("CAND_A_", symbol2),
            string.concat("CAND_B_", symbol2),
            string.concat("CAND_C_", symbol2),
            "INVALID_GNO",
            string.concat("INVALID_", symbol2)
        ];
        uint256[8] memory slots = [uint256(0), 1, 2, 0, 1, 2, 3, 3];
        IERC20[8] memory collaterals = [
            collateralToken1,
            collateralToken1,
            collateralToken1,
            collateralToken2,
            collateralToken2,
            collateralToken2,
            collateralToken1,
            collateralToken2
        ];

        for (uint256 i = 0; i < 8; i++) {
            (IERC20 token, bytes memory data) = proposal.wrappedOutcome(i);
            assertEq(symbol(token), expectedSymbols[i]);

            // the token wraps the CTF position of that slot and collateral.
            uint256 tokenId = router.getTokenId(collaterals[i], bytes32(0), proposal.conditionId(), 1 << slots[i]);
            assertEq(
                address(IWrapped1155Factory(wrapped1155Factory).requireWrapped1155(conditionalTokens, tokenId, data)),
                address(token)
            );
        }

        vm.expectRevert();
        proposal.wrappedOutcome(8);
    }

    function test_answerWinsItsSlot() public {
        FutarchyProposal proposal = createProposal(3);
        resolve(proposal, bytes32(uint256(1)));
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 1);
    }

    function test_firstAnswerWins() public {
        FutarchyProposal proposal = createProposal(3);
        resolve(proposal, bytes32(uint256(0)));
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 0);
    }

    function test_lastAnswerWins() public {
        FutarchyProposal proposal = createProposal(3);
        resolve(proposal, bytes32(uint256(2)));
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 2);
    }

    function test_invalidAnswerPaysInvalid() public {
        FutarchyProposal proposal = createProposal(3);
        resolve(proposal, INVALID_RESULT);
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 3);
    }

    function test_outOfRangeAnswerPaysInvalid() public {
        FutarchyProposal proposal = createProposal(3);
        resolve(proposal, bytes32(uint256(3)));
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 3);
    }

    function test_twoCandidates_secondWins() public {
        FutarchyProposal proposal = createProposal(2);
        assertEq(IConditionalTokens(conditionalTokens).getOutcomeSlotCount(proposal.conditionId()), 3);
        assertEq(symbol(wrapped(proposal, 4)), "INVALID_GNO");

        resolve(proposal, bytes32(uint256(1)));
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 1);
    }

    function test_twoCandidates_invalidDoesNotPaySecond() public {
        // FutarchyFactory pays No (slot 1) on Invalid; categorical proposals pay INVALID instead.
        FutarchyProposal proposal = createProposal(2);
        resolve(proposal, INVALID_RESULT);
        splitMergeAndRedeem(proposal);
        assertOnlySlotWon(proposal, 2);
    }

    function test_mergeNeedsInvalidTokens() public {
        FutarchyProposal proposal = createProposal(3);
        deal(address(collateralToken1), user, 10 ether);

        vm.startPrank(user);
        collateralToken1.approve(address(router), 10 ether);
        router.splitPosition(proposal, collateralToken1, 10 ether);
        for (uint256 i = 0; i < 8; i++) {
            wrapped(proposal, i).approve(address(router), type(uint256).max);
        }
        wrapped(proposal, 6).transfer(address(1), 10 ether); // INVALID_GNO

        vm.expectRevert();
        router.mergePositions(proposal, collateralToken1, 1 ether);
        vm.stopPrank();
    }

    function test_redeemBeforeResolutionReverts() public {
        FutarchyProposal proposal = createProposal(3);
        vm.expectRevert("Proposal not resolved");
        router.redeemPositions(proposal, collateralToken1, 1 ether);
    }

    function test_rejectsOtherCollateral() public {
        FutarchyProposal proposal = createProposal(3);
        IERC20 other = IERC20(0xaf204776c7245bF4147c2612BF6e5972Ee483701);
        deal(address(other), user, 1 ether);

        // like FutarchyRouter, it treats any other collateral as collateralToken2 and fails sending its tokens.
        vm.startPrank(user);
        other.approve(address(router), 1 ether);
        vm.expectRevert();
        router.splitPosition(proposal, other, 1 ether);
        vm.stopPrank();
    }

    function test_rejectsBadParams() public {
        string[] memory one = new string[](1);
        one[0] = "Candidate A";
        string[] memory two = new string[](2);
        two[0] = "Candidate A";
        two[1] = "Candidate B";

        FutarchyCategoricalFactory.CreateProposalParams memory params = FutarchyCategoricalFactory.CreateProposalParams({
            marketName: "Who will win?",
            outcomes: one,
            tokenNames: one,
            collateralToken1: collateralToken1,
            collateralToken2: collateralToken2,
            category: "politics",
            lang: "en_US",
            minBond: MIN_BOND,
            openingTime: uint32(block.timestamp) + 60
        });

        vm.expectRevert("Outcomes count must be 2 or more");
        factory.createProposal(params);

        params.outcomes = two;
        vm.expectRevert("Token names count mismatch");
        factory.createProposal(params);
    }
}
