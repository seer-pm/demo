pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "./BaseTest.sol";
import "../src/Market.sol";

contract ConditionalMarketsTest is BaseTest {
    uint256 constant MAX_SPLIT_AMOUNT = 100_000_000 ether;

    function test_splitsDeepPosition() public {
        vm.startPrank(msg.sender);
        uint256 numOutcomes = 2;
        uint256 splitAmount = 1 ether;

        Market categoricalMarket = getCategoricalMarket(MIN_BOND, numOutcomes);
        Market deepScalarMarket = getScalarMarket(
            MIN_BOND,
            numOutcomes,
            0,
            address(categoricalMarket)
        );

        IERC20(collateralToken).approve(address(gnosisRouter), splitAmount);
        deal(collateralToken, address(msg.sender), splitAmount);

        // split shallow position
        gnosisRouter.splitPosition(
            IERC20(collateralToken),
            bytes32(0),
            categoricalMarket.conditionId(),
            splitAmount
        );

        // split deep position
        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            categoricalMarket.conditionId(),
            categoricalMarket.parentCollectionId(),
            getPartition(1)
        );
        gnosisRouter.splitPosition(
            IERC20(collateralToken),
            deepScalarMarket.parentCollectionId(),
            deepScalarMarket.conditionId(),
            splitAmount
        );

        // assert split balances
        assertOutcomesBalances(
            msg.sender,
            categoricalMarket.conditionId(),
            getPartition(1),
            0
        );
        assertOutcomesBalances(
            msg.sender,
            deepScalarMarket.conditionId(),
            deepScalarMarket.parentCollectionId(),
            getPartition(numOutcomes + 1),
            splitAmount
        );

        // merge
        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            deepScalarMarket.conditionId(),
            deepScalarMarket.parentCollectionId(),
            getPartition(numOutcomes + 1)
        );
        gnosisRouter.mergePositions(
            IERC20(collateralToken),
            deepScalarMarket.parentCollectionId(),
            deepScalarMarket.conditionId(),
            splitAmount
        );

        // assert merge balances
        assertOutcomesBalances(
            msg.sender,
            categoricalMarket.conditionId(),
            getPartition(1),
            splitAmount
        );
        assertOutcomesBalances(
            msg.sender,
            deepScalarMarket.conditionId(),
            deepScalarMarket.parentCollectionId(),
            getPartition(numOutcomes + 1),
            0
        );

        // split deep position again
        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            categoricalMarket.conditionId(),
            categoricalMarket.parentCollectionId(),
            getPartition(1)
        );
        gnosisRouter.splitPosition(
            IERC20(collateralToken),
            deepScalarMarket.parentCollectionId(),
            deepScalarMarket.conditionId(),
            splitAmount
        );

        // submit answer
        skip(60); // skip opening timestamp

        bytes32 answer = bytes32(uint256(2500));
        bytes32[] memory questionsIds = deepScalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        deepScalarMarket.resolve();

        // redeem
        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            deepScalarMarket.conditionId(),
            deepScalarMarket.parentCollectionId(),
            getPartition(1)
        );
        gnosisRouter.redeemPositions(
            IERC20(collateralToken),
            deepScalarMarket.parentCollectionId(),
            deepScalarMarket.conditionId(),
            getPartition(1)
        );

        assertOutcomesBalances(
            msg.sender,
            categoricalMarket.conditionId(),
            getPartition(numOutcomes + 1),
            splitAmount
        );
        assertOutcomesBalances(
            msg.sender,
            deepScalarMarket.conditionId(),
            deepScalarMarket.parentCollectionId(),
            getPartition(1),
            0
        );

        vm.stopPrank();
    }
}
