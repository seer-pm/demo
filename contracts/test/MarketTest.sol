pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/MarketFactory.sol";
import "../src/Market.sol";
import "../src/RealityProxy.sol";
import {IRealityETH_v3_0, IConditionalTokens, Wrapped1155Factory} from "../src/Interfaces.sol";

contract MarketFactoryTest is Test {
    // gnosis addresses
    MarketFactory marketFactory;
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

    function setUp() public {
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
            address(0)
        );
    }

    function test_createsCategoricalMarket() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        string[] memory tokenNames = new string[](2);
        tokenNames[0] = "YES";
        tokenNames[1] = "NO";

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
                    tokenNames: outcomes,
                    minBond: 5000000000000000000,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        skip(60); // opening timestamp

        IRealityETH_v3_0(realitio).submitAnswer{value: 5000000000000000000}(
            market.questionId(),
            bytes32(0),
            0
        );

        skip(60 * 60 * 24 * 2); // question timeout

        market.resolve();
    }

    function test_createsScalarMarket() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Low";
        outcomes[1] = "High";

        string[] memory tokenNames = new string[](2);
        tokenNames[0] = "LOW";
        tokenNames[1] = "HIGH";

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
                    minBond: 5000000000000000000,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 2500,
                    upperBound: 3500
                })
            )
        );

        skip(60); // opening timestamp

        IRealityETH_v3_0(realitio).submitAnswer{value: 5000000000000000000}(
            market.questionId(),
            bytes32(0),
            0
        );

        skip(60 * 60 * 24 * 2); // question timeout

        market.resolve();
    }

    function test_createsMultiScalarMarket() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Vitalik_1";
        outcomes[1] = "Vitalik_2";

        string[] memory tokenNames = new string[](2);
        tokenNames[0] = "VITALIK_1";
        tokenNames[1] = "VITALIK-2";

        string[] memory encodedQuestions = new string[](2);
        encodedQuestions[
            0
        ] = unicode"How many votes will Vitalik_1 get?␟technology␟en_US";
        encodedQuestions[
            1
        ] = unicode"How many votes will Vitalik_2 get?␟technology␟en_US";

        Market market = Market(
            marketFactory.createMultiScalarMarket(
                MarketFactory.CreateMarketParams({
                    marketName: "Ethereum President Elections",
                    encodedQuestions: encodedQuestions,
                    outcomes: outcomes,
                    tokenNames: tokenNames,
                    minBond: 5000000000000000000,
                    openingTime: uint32(block.timestamp) + 60,
                    lowerBound: 0,
                    upperBound: 0
                })
            )
        );

        skip(60); // opening timestamp

        IRealityETH_v3_0(realitio).submitAnswer{value: 5000000000000000000}(
            market.questionsIds(0),
            bytes32(uint256(1)),
            0
        );
        IRealityETH_v3_0(realitio).submitAnswer{value: 5000000000000000000}(
            market.questionsIds(1),
            bytes32(uint256(2)),
            0
        );

        skip(60 * 60 * 24 * 2); // question timeout

        market.resolve();
    }
}
