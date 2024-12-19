// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../src/trade/TradeManager.sol";
import "../src/trade/TradeQuoter.sol";
import "../src/trade/Interfaces.sol";
import "../src/trade/Interfaces.sol";

// run this test on a custom anvil node otherwise it could get stuck
contract TradeManagerTest is Test {
    TradeManager public tradeManager;
    TradeQuoter public tradeQuoter;
    address constant TRADE_QUOTER_ADDRESS = 0x0486E82ab78812f7aCb128DA32Ad0ceF0A999774;
    address constant XDAI = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address constant SDAI_ADDRESS = 0xaf204776c7245bF4147c2612BF6e5972Ee483701;
    address constant MARKET_ID = 0xfe2cC518b4D8C1D5db682db553c3de750d901cE0;
    address constant OUTCOME_TOKEN_ADDRESS =
        0x80cFa427a022d735C74c407F6A1d546F8280Be26;

    address public signer;

    function setUp() public {
        // Fork Gnosis chain
        // uint256 forkId = vm.createFork("https://rpc.ap-southeast-1.gateway.fm/v4/gnosis/non-archival/mainnet");
        // vm.selectFork(forkId);

        // Deploy contracts
        tradeManager = new TradeManager();
        tradeQuoter = TradeQuoter(TRADE_QUOTER_ADDRESS);

        // // Set up signer
        signer = makeAddr("testSigner");
        vm.deal(signer, 1000 ether);
    }

    function testBuyConditionalOutcomeTokens() public {
        // Get market and its ancestry
        IMarket market = IMarket(MARKET_ID);

        // Prepare ancestor markets array
        address[] memory ancestorMarketIds = new address[](3);
        address[] memory ancestorTokens = new address[](3);

        ancestorMarketIds[2] = MARKET_ID;
        ancestorTokens[2] = OUTCOME_TOKEN_ADDRESS;

        address currentMarketAddress = market.parentMarket();
        (IERC20 currentToken, ) = market.parentWrappedOutcome();

        ancestorMarketIds[1] = currentMarketAddress;
        ancestorTokens[1] = address(currentToken);

        ancestorMarketIds[0] = address(0);
        ancestorTokens[0] = SDAI_ADDRESS;

        // Prepare trade paths
        TradeManager.TokenPath[] memory paths = new TradeManager.TokenPath[](2);

        uint256 amountIn = 50 ether;
        uint256[] memory amountIns = new uint256[](3);
        amountIns[0] = amountIn;

        // Simulate trading through markets
        for (uint256 i = 0; i < ancestorMarketIds.length - 1; i++) {
            (
                uint256 amountOut,
                TradeManager.TradeChoice choice
            ) = quoteTradeSingleAndCompare(
                    amountIn,
                    ancestorTokens[i],
                    ancestorTokens[i + 1],
                    ancestorMarketIds[i],
                    ancestorMarketIds[i + 1]
                );

            amountIn = amountOut;
            amountIns[i + 1] = amountOut;

            paths[i] = TradeManager.TokenPath({
                tokenIn: ancestorTokens[i],
                tokenOut: ancestorTokens[i + 1],
                tokenInMarket: ancestorMarketIds[i],
                tokenOutMarket: ancestorMarketIds[i + 1],
                choice: choice
            });
        }

        // // Deposit to savings
        SavingsXDaiAdapter savingsXDaiAdapter = SavingsXDaiAdapter(
            0xD499b51fcFc66bd31248ef4b28d656d67E591A94
        );
        vm.prank(signer);
        savingsXDaiAdapter.depositXDAI{value: 100 ether}(signer);

        // Prepare tokens for checking
        address[] memory tokens = new address[](7);
        tokens[0] = SDAI_ADDRESS;
        tokens[1] = 0x6b8c2ae8DBa895620475259e95377FDe08FBF02a;
        tokens[2] = 0x68984a7D283fF918e530368E6AAaD1fC2af88692;
        tokens[3] = 0x7eec58191E30f2550e2BE43664D6F8017A359dc5;
        tokens[4] = OUTCOME_TOKEN_ADDRESS;
        tokens[5] = 0x83717Dcf8F5C64E135e87446EB515fA70185f2D9;
        tokens[6] = 0x6209bb7356e1652cE9978ba56cf5a8A54B6E518E;

        // Check initial balances
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != SDAI_ADDRESS) {
                assertEq(IERC20(tokens[i]).balanceOf(signer), 0);
            }
            assertEq(IERC20(tokens[i]).balanceOf(address(tradeManager)), 0);
        }

        // Approve and perform trade
        vm.startPrank(signer);
        IERC20(SDAI_ADDRESS).approve(address(tradeManager), 50 ether);
        tradeManager.exactInput(
            paths,
            TradeManager.AdditionalTradeParams({
                recipient: signer,
                originalRecipient: signer,
                deadline: block.timestamp + 1 hours,
                amountIn: 50 ether,
                amountOutMinimum: 0
            })
        );
        vm.stopPrank();

        // Verify final balances
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == OUTCOME_TOKEN_ADDRESS) {
                assertEq(IERC20(tokens[i]).balanceOf(signer), amountIns[2]);
            }
            assertEq(IERC20(tokens[i]).balanceOf(address(tradeManager)), 0);
        }
    }


    function quoteTradeSingleAndCompare(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address tokenInMarket,
        address tokenOutMarket
    ) internal returns (uint256 amountOut, TradeManager.TradeChoice choice) {
        uint256 amountOutSwap;
        uint256 amountOutMint;
        try
            tradeQuoter.quoteSwapSingle(
                TradeQuoter.QuoteParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    tokenInMarket: tokenInMarket,
                    tokenOutMarket: tokenOutMarket,
                    amountIn: amountIn
                })
            )
        returns (uint256 amountOut, uint16 fee) {
            amountOutSwap = amountOut;
        } catch {}

        try
            tradeQuoter.quoteMintSingle(
                TradeQuoter.QuoteParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    tokenInMarket: tokenInMarket,
                    tokenOutMarket: tokenOutMarket,
                    amountIn: amountIn
                })
            )
        returns (uint256 amountOut, uint16 fee) {
            amountOutMint = amountOut;
        } catch {}
        require(
            amountOutSwap != 0 || amountOutMint != 0,
            "Cannot trade this pair"
        );
        return (
            amountOutSwap > amountOutMint ? amountOutSwap : amountOutMint,
            amountOutSwap > amountOutMint
                ? TradeManager.TradeChoice.Swap
                : TradeManager.TradeChoice.Mint
        );
    }
}
