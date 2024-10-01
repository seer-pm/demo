pragma solidity 0.8.20;

import "../src/Market.sol";
import "./BaseTest.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";

contract ConditionalMarketsTest is BaseTest {
    uint256 constant MAX_SPLIT_AMOUNT = 100_000_000 ether;

    function test_splitsDeepPosition() public {
        vm.startPrank(msg.sender);
        uint256 numOutcomes = 2;
        uint256 splitAmount = 1 ether;

        Market categoricalMarket = getCategoricalMarket(MIN_BOND, numOutcomes);
        Market deepScalarMarket = getScalarMarket(MIN_BOND, numOutcomes, 0, address(categoricalMarket));

        IERC20(collateralToken).approve(address(gnosisRouter), splitAmount);
        deal(collateralToken, address(msg.sender), splitAmount);

        // split shallow position
        gnosisRouter.splitPosition(IERC20(collateralToken), categoricalMarket, splitAmount);

        // split deep position
        approveWrappedTokens(address(gnosisRouter), splitAmount, categoricalMarket, getPartition(1));
        gnosisRouter.splitPosition(IERC20(collateralToken), deepScalarMarket, splitAmount);

        // assert split balances
        assertOutcomesBalances(msg.sender, categoricalMarket, getPartition(1), 0);
        assertOutcomesBalances(msg.sender, deepScalarMarket, getPartition(numOutcomes + 1), splitAmount);

        // merge
        approveWrappedTokens(address(gnosisRouter), splitAmount, deepScalarMarket, getPartition(numOutcomes + 1));
        gnosisRouter.mergePositions(IERC20(collateralToken), deepScalarMarket, splitAmount);

        // assert merge balances
        assertOutcomesBalances(msg.sender, categoricalMarket, getPartition(1), splitAmount);
        assertOutcomesBalances(msg.sender, deepScalarMarket, getPartition(numOutcomes + 1), 0);

        // split deep position again
        approveWrappedTokens(address(gnosisRouter), splitAmount, categoricalMarket, getPartition(1));
        gnosisRouter.splitPosition(IERC20(collateralToken), deepScalarMarket, splitAmount);

        // submit answer
        skip(60); // skip opening timestamp

        bytes32 answer = bytes32(uint256(2500));
        bytes32[] memory questionsIds = deepScalarMarket.questionsIds();
        submitAnswer(questionsIds[0], answer);

        skip(60 * 60 * 24 * 2); // question timeout

        deepScalarMarket.resolve();

        // redeem
        approveWrappedTokens(address(gnosisRouter), splitAmount, deepScalarMarket, getPartition(1));
        gnosisRouter.redeemPositions(
            IERC20(collateralToken), deepScalarMarket, getOutcomesIndex(1), getRedeemAmounts(1, splitAmount)
        );

        assertOutcomesBalances(msg.sender, categoricalMarket, getPartition(numOutcomes + 1), splitAmount);
        assertOutcomesBalances(msg.sender, deepScalarMarket, getPartition(1), 0);

        vm.stopPrank();
    }
}
