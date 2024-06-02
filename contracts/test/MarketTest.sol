pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "./BaseTest.sol";
import "../src/MarketFactory.sol";
import "../src/Market.sol";
import "../src/RealityProxy.sol";
import "../src/GnosisRouter.sol";
import {IRealityETH_v3_0, IConditionalTokens, Wrapped1155Factory, IERC20} from "../src/Interfaces.sol";
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
        
        Market categoricalMarket = getCategoricalMarket(MIN_BOND);
        skip(60); // skip opening timestamp

        submitAnswer(categoricalMarket.questionsIds(0), answer);

        skip(60 * 60 * 24 * 2); // question timeout

        categoricalMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(categoricalMarket, getPartition(2 + 1), splitAmount);

        vm.stopPrank();
    }

    function test_createsMultiCategoricalMarket(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market multiCategoricalMarket = getMultiCategoricalMarket(MIN_BOND);
        skip(60); // skip opening timestamp

        submitAnswer(
            multiCategoricalMarket.questionsIds(0),
            answer
        );

        skip(60 * 60 * 24 * 2); // question timeout

        multiCategoricalMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(
            multiCategoricalMarket,
            getPartition(3 + 1),
            splitAmount
        );

        vm.stopPrank();
    }

    function test_createsScalarMarket(uint256 splitAmount, bytes32 answer) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON);

        Market scalarMarket = getScalarMarket(MIN_BOND);
        skip(60); // skip opening timestamp

        submitAnswer(scalarMarket.questionsIds(0), answer);

        skip(60 * 60 * 24 * 2); // question timeout

        scalarMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(scalarMarket, getPartition(2 + 1), splitAmount);

        vm.stopPrank();
    }

    function test_createsMultiScalarMarket(uint256 splitAmount, bytes32 answer, bytes32 answer2) public {
        vm.assume(splitAmount < MAX_SPLIT_AMOUNT);
        vm.assume(answer != ANSWERED_TOO_SOON && answer2 != ANSWERED_TOO_SOON);

        Market multiScalarMarket = getMultiScalarMarket(MIN_BOND);
        skip(60); // skip opening timestamp

        submitAnswer(multiScalarMarket.questionsIds(0), answer);
        submitAnswer(multiScalarMarket.questionsIds(1), answer2);

        skip(60 * 60 * 24 * 2); // question timeout

        multiScalarMarket.resolve();

        vm.startPrank(msg.sender);

        splitMergeAndRedeem(multiScalarMarket, getPartition(2), splitAmount);

        vm.stopPrank();
    }
}
