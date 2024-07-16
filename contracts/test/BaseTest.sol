pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/Market.sol";
import "../src/RealityProxy.sol";
import "../src/GnosisRouter.sol";
import {IRealityETH_v3_0, IConditionalTokens, Wrapped1155Factory, IERC20} from "../src/Interfaces.sol";
import "solmate/src/utils/LibString.sol";
import "forge-std/console.sol";

interface ISavingsXDai is IERC20 {
    function convertToShares(uint256 assets) external view returns (uint256);
}

contract BaseTest is Test {
    using LibString for uint256;

    MarketFactory marketFactory;

    GnosisRouter gnosisRouter;

    // gnosis addresses
    address internal arbitrator =
        address(0xe40DD83a262da3f56976038F1554Fe541Fa75ecd);
    address internal realitio =
        address(0xE78996A233895bE74a66F451f1019cA9734205cc);
    address internal conditionalTokens =
        address(0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce);
    address internal collateralToken =
        address(0xaf204776c7245bF4147c2612BF6e5972Ee483701);
    address internal wrapped1155Factory =
        address(0xD194319D1804C1051DD21Ba1Dc931cA72410B79f);

    uint256 constant MIN_BOND = 5 ether;

    bytes32 constant INVALID_RESULT =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    bytes32 constant ANSWERED_TOO_SOON =
        0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe;

    function setUp() public {
        uint256 forkId = vm.createFork("https://rpc.gnosischain.com");
        vm.selectFork(forkId);

        Market market = new Market();

        WrappedERC20Factory wrappedERC20Factory = new WrappedERC20Factory(
            Wrapped1155Factory(wrapped1155Factory)
        );

        RealityProxy realityProxy = new RealityProxy(
            IConditionalTokens(conditionalTokens),
            IRealityETH_v3_0(realitio)
        );

        marketFactory = new MarketFactory(
            address(market),
            arbitrator,
            IRealityETH_v3_0(realitio),
            wrappedERC20Factory,
            IConditionalTokens(conditionalTokens),
            collateralToken,
            realityProxy,
            address(0),
            1.5 days
        );

        gnosisRouter = new GnosisRouter(
            IConditionalTokens(conditionalTokens),
            wrappedERC20Factory
        );
    }

    function getOutcomesAndTokens(
        uint256 numOutcomes
    ) internal pure returns (string[] memory, string[] memory) {
        string[] memory outcomes = new string[](numOutcomes);
        string[] memory tokenNames = new string[](numOutcomes);

        for (uint256 i = 0; i < numOutcomes; i++) {
            outcomes[i] = string.concat("OUTCOME_", i.toString());
            tokenNames[i] = string.concat("OUTCOME_", i.toString());
        }

        return (outcomes, tokenNames);
    }

    function getCategoricalMarket(
        uint256 minBond,
        uint256 numOutcomes
    ) public returns (Market) {
        (
            string[] memory outcomes,
            string[] memory tokenNames
        ) = getOutcomesAndTokens(numOutcomes);

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[
            0
        ] = unicode'Will Ethereum ETF launch before Feb 29, 2024?␟"yes","no"␟technology␟en_US';

        Market market = Market(
            marketFactory.createCategoricalMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "Will Ethereum ETF launch before Feb 29, 2024?",
                    encodedQuestions: encodedQuestions,
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: minBond,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        return market;
    }

    function getMultiCategoricalMarket(
        uint256 minBond,
        uint256 numOutcomes
    ) public returns (Market) {
        (
            string[] memory outcomes,
            string[] memory tokenNames
        ) = getOutcomesAndTokens(numOutcomes);

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[
            0
        ] = unicode'Will Ethereum ETF launch before Feb 29, 2024?␟"yes","no","maybe"␟technology␟en_US';

        Market market = Market(
            marketFactory.createMultiCategoricalMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "Will Ethereum ETF launch before Feb 29, 2024?",
                    encodedQuestions: encodedQuestions,
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: minBond,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        return market;
    }

    function getScalarMarket(
        uint256 minBond,
        uint256 numOutcomes
    ) public returns (Market) {
        (
            string[] memory outcomes,
            string[] memory tokenNames
        ) = getOutcomesAndTokens(numOutcomes);

        string[] memory encodedQuestions = new string[](1);
        encodedQuestions[
            0
        ] = unicode'What will be ETH price on Feb 29, 2024?␟"2500","3500"␟technology␟en_US';

        Market market = Market(
            marketFactory.createScalarMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "What will be ETH price on Feb 29, 2024?",
                    encodedQuestions: encodedQuestions,
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: minBond,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 2500,
                    upperBound: 3500
                })
            )
        );

        return market;
    }

    function getMultiScalarMarket(
        uint256 minBond,
        uint256 numOutcomes
    ) public returns (Market) {
        (
            string[] memory outcomes,
            string[] memory tokenNames
        ) = getOutcomesAndTokens(numOutcomes);

        string[] memory encodedQuestions = new string[](numOutcomes);
        for (uint256 i = 0; i < numOutcomes; i++) {
            encodedQuestions[i] = string.concat(
                unicode"How many votes will Vitalik_",
                i.toString(),
                unicode" get?␟technology␟en_US"
            );
        }

        Market market = Market(
            marketFactory.createMultiScalarMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "Ethereum President Elections",
                    encodedQuestions: encodedQuestions,
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: minBond,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        return market;
    }

    function submitAnswer(bytes32 questionId, bytes32 answer) public {
        IRealityETH_v3_0(realitio).submitAnswer{value: MIN_BOND}(
            questionId,
            answer,
            0
        );
    }

    function assertOutcomesBalances(
        address owner,
        bytes32 conditionId,
        uint256[] memory partition,
        uint256 amount
    ) public {
        for (uint256 i = 0; i < partition.length; i++) {
            assertEq(
                IERC20(
                    gnosisRouter.getTokenAddress(
                        IERC20(collateralToken),
                        bytes32(0),
                        conditionId,
                        partition[i]
                    )
                ).balanceOf(owner),
                amount
            );
        }
    }

    function splitMergeAndRedeem(
        Market market,
        uint256[] memory partition,
        uint256 splitAmount
    ) public {
        uint256 amountToMerge = splitAmount / uint256(3);
        uint256 amountToRedeem = splitAmount - amountToMerge;

        IERC20(collateralToken).approve(address(gnosisRouter), splitAmount);

        // split, merge & redeem
        deal(collateralToken, address(msg.sender), splitAmount);

        gnosisRouter.splitPosition(
            IERC20(collateralToken),
            bytes32(0),
            market.conditionId(),
            partition,
            splitAmount
        );

        assertOutcomesBalances(
            msg.sender,
            market.conditionId(),
            partition,
            splitAmount
        );

        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            market.conditionId(),
            partition
        );

        gnosisRouter.mergePositions(
            IERC20(collateralToken),
            bytes32(0),
            market.conditionId(),
            partition,
            amountToMerge
        );

        assertOutcomesBalances(
            msg.sender,
            market.conditionId(),
            partition,
            amountToRedeem
        );

        gnosisRouter.redeemPositions(
            IERC20(collateralToken),
            bytes32(0),
            market.conditionId(),
            partition
        );

        assertOutcomesBalances(msg.sender, market.conditionId(), partition, 0);

        // split, merge & redeem to base
        vm.deal(address(msg.sender), splitAmount);

        gnosisRouter.splitFromBase{value: splitAmount}(
            bytes32(0),
            market.conditionId(),
            partition
        );

        // calculate xDAI => sDAI conversion rate
        uint256 splitAmountInSDai = ISavingsXDai(collateralToken).convertToShares(splitAmount);
        assertOutcomesBalances(
            msg.sender,
            market.conditionId(),
            partition,
            splitAmountInSDai
        );

        approveWrappedTokens(
            address(gnosisRouter),
            splitAmount,
            market.conditionId(),
            partition
        );

        gnosisRouter.mergeToBase(
            bytes32(0),
            market.conditionId(),
            partition,
            amountToMerge
        );
        
        // amountToMerge is understood as sDai, not xDai
        uint256 amountToRedeemInSDai = splitAmountInSDai - amountToMerge;

        assertOutcomesBalances(
            msg.sender,
            market.conditionId(),
            partition,
            amountToRedeemInSDai
        );

        gnosisRouter.redeemToBase(bytes32(0), market.conditionId(), partition);

        assertOutcomesBalances(msg.sender, market.conditionId(), partition, 0);
    }

    function approveWrappedTokens(
        address spender,
        uint256 amount,
        bytes32 conditionId,
        uint256[] memory partition
    ) public {
        for (uint256 i = 0; i < partition.length; i++) {
            IERC20 token = IERC20(
                gnosisRouter.getTokenAddress(
                    IERC20(collateralToken),
                    bytes32(0),
                    conditionId,
                    partition[i]
                )
            );
            token.approve(spender, amount);
        }
    }

    function getPartition(uint256 size) public pure returns (uint256[] memory) {
        uint256[] memory partition = new uint256[](size);

        for (uint i = 0; i < size; i++) {
            partition[i] = 1 << i;
        }

        return partition;
    }
}
