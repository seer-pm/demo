pragma solidity 0.8.20;

import "../src/GnosisRouter.sol";
import "../src/Market.sol";
import "../src/MarketFactory.sol";
import "../src/RealityProxy.sol";
import "./BaseTest.sol";
import "forge-std/Test.sol";

import "forge-std/console.sol";

contract MarketFactoryTest is BaseTest {
    uint256 constant MAX_SPLIT_AMOUNT = 100_000_000 ether;

    function fixtureAnswer() public pure returns (bytes32[] memory) {
        bytes32[] memory answers = new bytes32[](13);
        answers[0] = bytes32(uint256(0));
        answers[1] = bytes32(uint256(1));
        answers[2] = bytes32(uint256(2));
        answers[3] = bytes32(uint256(3));
        answers[4] = bytes32(uint256(4));
        answers[5] = bytes32(uint256(5));
        answers[6] = bytes32(uint256(6));
        answers[7] = bytes32(uint256(7));
        answers[8] = bytes32(uint256(8));
        answers[9] = bytes32(uint256(9));
        answers[10] = bytes32(uint256(10));
        answers[11] = INVALID_RESULT;
        answers[12] = ANSWERED_TOO_SOON;

        return answers;
    }

    function test_createsCategoricalMarket(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        uint256 numOutcomes = 3;

        Market categoricalMarket = getCategoricalMarket(MIN_BOND, numOutcomes);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = categoricalMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        categoricalMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(
            categoricalMarket, getPartition(numOutcomes + 1), getOutcomesIndex(numOutcomes + 1), splitAmount
        );

        vm.stopPrank();
    }

    function test_createsMultiCategoricalMarket(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market multiCategoricalMarket = getMultiCategoricalMarket(MIN_BOND, 3);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = multiCategoricalMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        multiCategoricalMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(multiCategoricalMarket, getPartition(3 + 1), getOutcomesIndex(3 + 1), splitAmount);

        vm.stopPrank();
    }

    function test_createsScalarMarket(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market scalarMarket = getScalarMarket(MIN_BOND, 2);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = scalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        scalarMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(scalarMarket, getPartition(2 + 1), getOutcomesIndex(2 + 1), splitAmount);

        vm.stopPrank();
    }

    function test_createsMultiScalarMarket(uint256 splitAmount, bytes32 answer, bytes32 answer2) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON && answer2 != ANSWERED_TOO_SOON);

        Market multiScalarMarket = getMultiScalarMarket(MIN_BOND, 2);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = multiScalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);
        submitAnswer(questionsIds[1], answer2);

        skip(60 * 60 * 24 * 2); // question timeout

        multiScalarMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(multiScalarMarket, getPartition(2 + 1), getOutcomesIndex(2 + 1), splitAmount);

        vm.stopPrank();
    }

    function assertNotEmptyPayout(uint256[] memory payoutNumerators) internal {
        uint256 sum = 0;
        for (uint256 i = 0; i < payoutNumerators.length; i++) {
            sum += payoutNumerators[i];
        }
        assertGt(sum, 0);
    }

    function test_categoricalMarketPayout(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market categoricalMarket = getCategoricalMarket(MIN_BOND, 40);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = categoricalMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        vm.recordLogs();

        categoricalMarket.resolve();

        Vm.Log[] memory entries = vm.getRecordedLogs();

        // ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)
        (, uint256[] memory payoutNumerators) = abi.decode(entries[0].data, (uint256, uint256[]));

        assertNotEmptyPayout(payoutNumerators);

        if (uint256(answer) >= 0 && uint256(answer) <= categoricalMarket.numOutcomes()) {
            // valid outcomes (results between 0 and outcomeSlotCount)
            for (uint256 i = 0; i < payoutNumerators.length; i++) {
                assertEq(payoutNumerators[i], i == uint256(answer) ? 1 : 0);
            }
        } else {
            // invalid outcomes
            for (uint256 i = 0; i < payoutNumerators.length; i++) {
                assertEq(payoutNumerators[i], i == categoricalMarket.numOutcomes() ? 1 : 0);
            }
        }
    }

    function test_multiCategoricalMarketPayout(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market multiCategoricalMarket = getMultiCategoricalMarket(MIN_BOND, 3);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = multiCategoricalMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        vm.recordLogs();

        multiCategoricalMarket.resolve();

        Vm.Log[] memory entries = vm.getRecordedLogs();

        // ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)
        (, uint256[] memory payoutNumerators) = abi.decode(entries[0].data, (uint256, uint256[]));

        assertNotEmptyPayout(payoutNumerators);

        if (answer == INVALID_RESULT || answer == bytes32(0)) {
            // invalid outcomes
            for (uint256 i = 0; i < payoutNumerators.length; i++) {
                assertEq(payoutNumerators[i], i == multiCategoricalMarket.numOutcomes() ? 1 : 0);
            }
        } else {
            // valid outcomes
            bool allZeroes = true;
            for (uint256 i = 0; i < payoutNumerators.length - 1; i++) {
                uint256 currentPayout = (uint256(answer) >> i) & 1;
                allZeroes = allZeroes && currentPayout == 0;
                if (i == multiCategoricalMarket.numOutcomes()) {
                    assertEq(payoutNumerators[i], allZeroes ? 1 : 0);
                } else {
                    assertEq(payoutNumerators[i], currentPayout);
                }
            }
        }
    }

    function test_scalarMarketPayout(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market scalarMarket = getScalarMarket(MIN_BOND, 2);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = scalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        vm.recordLogs();

        scalarMarket.resolve();

        Vm.Log[] memory entries = vm.getRecordedLogs();

        // ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)
        (, uint256[] memory payoutNumerators) = abi.decode(entries[0].data, (uint256, uint256[]));

        assertNotEmptyPayout(payoutNumerators);

        if (answer == INVALID_RESULT) {
            // invalid
            for (uint256 i = 0; i < payoutNumerators.length; i++) {
                assertEq(payoutNumerators[i], i == scalarMarket.numOutcomes() ? 1 : 0);
            }
        } else {
            uint256 low = scalarMarket.lowerBound();
            uint256 high = scalarMarket.upperBound();
            uint256[] memory expectedPayouts = new uint256[](3);

            // valid outcomes
            if (uint256(answer) <= low) {
                expectedPayouts[0] = 1;
            } else if (uint256(answer) >= high) {
                expectedPayouts[1] = 1;
            } else {
                expectedPayouts[0] = high - uint256(answer);
                expectedPayouts[1] = uint256(answer) - low;
            }
            assertEq(payoutNumerators, expectedPayouts);
        }
    }

    function test_multiScalarMarketPayout(uint256 splitAmount, bytes32 answer, bytes32 answer2) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON && answer2 != ANSWERED_TOO_SOON);

        Market multiScalarMarket = getMultiScalarMarket(MIN_BOND, 2);
        skip(60); // skip opening timestamp

        bytes32[] memory questionsIds = multiScalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);
        submitAnswer(questionsIds[1], answer2);

        skip(60 * 60 * 24 * 2); // question timeout

        vm.recordLogs();

        multiScalarMarket.resolve();

        Vm.Log[] memory entries = vm.getRecordedLogs();

        // ConditionResolution(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount, uint256[] payoutNumerators)
        (, uint256[] memory payoutNumerators) = abi.decode(entries[0].data, (uint256, uint256[]));

        assertNotEmptyPayout(payoutNumerators);

        if ((answer == bytes32(0) && answer2 == bytes32(0)) || (answer == INVALID_RESULT && answer2 == INVALID_RESULT))
        {
            // invalid
            for (uint256 i = 0; i < payoutNumerators.length; i++) {
                assertEq(payoutNumerators[i], i == multiScalarMarket.numOutcomes() ? 1 : 0);
            }
        } else if (answer == INVALID_RESULT) {
            assertEq(payoutNumerators[0], 0);
        } else if (answer2 == INVALID_RESULT) {
            assertEq(payoutNumerators[1], 0);
        } else {
            // valid outcomes
            uint256 maxPayout = 2 ** (256 / 2) - 1;
            assertEq(payoutNumerators[0], uint256(answer) > maxPayout ? maxPayout : uint256(answer));
            assertEq(payoutNumerators[1], uint256(answer2) > maxPayout ? maxPayout : uint256(answer2));
        }
    }

    function test_revertsIfCreatesCategoricalMarketWithOneQuestion() public {
        vm.expectRevert(bytes("Outcomes count must be 2 or more"));
        getCategoricalMarket(MIN_BOND, 1);
    }

    function test_revertsIfCreatesMultiCategoricalMarketWithOneQuestion() public {
        vm.expectRevert(bytes("Outcomes count must be 2 or more"));
        getMultiCategoricalMarket(MIN_BOND, 1);
    }

    function test_revertsIfCreatesScalarMarketWithOtherThanTwoQuestions(uint8 numOutcomes) public {
        if (numOutcomes != 2) {
            vm.expectRevert(bytes("Outcomes count must be 2"));
        }
        getScalarMarket(MIN_BOND, uint256(numOutcomes));
    }

    function test_revertsIfCreatesMultiScalarMarketWithOneQuestion() public {
        vm.expectRevert(bytes("Outcomes count must be 2 or more"));
        getMultiScalarMarket(MIN_BOND, 1);
    }

    function test_canCreateRepeatedMarkets() public {
        getCategoricalMarket(MIN_BOND, 2);
        getCategoricalMarket(MIN_BOND, 2);

        getMultiCategoricalMarket(MIN_BOND, 2);
        getMultiCategoricalMarket(MIN_BOND, 2);

        getScalarMarket(MIN_BOND, 2);
        getScalarMarket(MIN_BOND, 2);

        getMultiScalarMarket(MIN_BOND, 2);
        getMultiScalarMarket(MIN_BOND, 2);
    }

    function test_reusesQuestionBetweenMultiScalarMarkets() public {
        // multiscalar market with 2 questions
        Market multiScalar1 = getMultiScalarMarket(MIN_BOND, 2);

        // multiscalar market with 3 questions
        Market multiScalar2 = getMultiScalarMarket(MIN_BOND, 3);

        bytes32[] memory questionsIds1 = multiScalar1.questionsIds();
        bytes32[] memory questionsIds2 = multiScalar2.questionsIds();
        assertEq(questionsIds1[0], questionsIds2[0]);
        assertEq(questionsIds1[1], questionsIds2[1]);
    }

    function test_reusesQuestionBetweenScalarAndMultiScalarMarkets() public {
        uint256 numOutcomes = 2;
        (string[] memory outcomes, string[] memory tokenNames) = getOutcomesAndTokens(numOutcomes);

        // scalar market
        Market scalar = Market(
            marketFactory.createScalarMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "How many votes will OUTCOME_0 get?",
                    questionStart: "",
                    questionEnd: "",
                    outcomeType: "",
                    parentOutcome: 0,
                    parentMarket: address(0),
                    category: "misc",
                    lang: "en_US",
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: MIN_BOND,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 2500,
                    upperBound: 3500
                })
            )
        );

        // multi scalar market
        Market multiScalar = Market(
            marketFactory.createMultiScalarMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "",
                    questionStart: "How many votes will ",
                    questionEnd: " get?",
                    outcomeType: "candidate",
                    parentOutcome: 0,
                    parentMarket: address(0),
                    category: "misc",
                    lang: "en_US",
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: MIN_BOND,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        bytes32[] memory questionsIdsScalar = scalar.questionsIds();
        bytes32[] memory questionsIdsMultiscalar = multiScalar.questionsIds();
        assertEq(questionsIdsScalar[0], questionsIdsMultiscalar[0]);
    }

    function test_encodedQuestions() public {
        Vm.Log[] memory entries;

        // categorical market
        vm.recordLogs();
        getCategoricalMarket(MIN_BOND, 2);
        entries = vm.getRecordedLogs();

        assertEq(
            getEncodedQuestion(entries, 0),
            unicode'Will Ethereum ETF launch before Feb 29, 2024?␟"OUTCOME_0","OUTCOME_1"␟technology␟en_US'
        );

        // multi categorical market
        vm.recordLogs();
        getMultiCategoricalMarket(MIN_BOND, 3);
        entries = vm.getRecordedLogs();

        assertEq(
            getEncodedQuestion(entries, 0),
            unicode'Will Ethereum ETF launch before Feb 29, 2024?␟"OUTCOME_0","OUTCOME_1","OUTCOME_2"␟misc␟en_US'
        );

        // scalar market
        vm.recordLogs();
        getScalarMarket(MIN_BOND, 2);
        entries = vm.getRecordedLogs();

        assertEq(getEncodedQuestion(entries, 0), unicode"What will be ETH price on Feb 29, 2024?␟misc␟en_US");

        // multi scalar market
        vm.recordLogs();
        getMultiScalarMarket(MIN_BOND, 2);
        entries = vm.getRecordedLogs();

        assertEq(getEncodedQuestion(entries, 0), unicode"How many votes will OUTCOME_0 get?␟misc␟en_US");

        assertEq(getEncodedQuestion(entries, 1), unicode"How many votes will OUTCOME_1 get?␟misc␟en_US");
    }
}
