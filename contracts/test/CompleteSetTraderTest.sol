pragma solidity 0.8.20;

import "../src/Market.sol";
import {CompleteSetTrader} from "../src/trade/CompleteSetTrader.sol";
import {IMarket, IRouter} from "../src/trade/Interfaces.sol";
import "./BaseTest.sol";
import {IERC20 as OzIERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "forge-std/Test.sol";

/// @dev A flat-price DEX with its own inventory. A sell past the collateral it holds fills only what it can,
/// the way a drained concentrated-liquidity pool does, and a buy past its outcome inventory reverts.
contract MockDex {
    OzIERC20 public immutable collateral;
    mapping(address => uint256) public price; // collateral per outcome token, 1e18 = 1

    constructor(OzIERC20 _collateral) {
        collateral = _collateral;
    }

    function setPrice(address token, uint256 _price) external {
        price[token] = _price;
    }

    function sell(OzIERC20 token, uint256 amountIn, uint256 minOut, address recipient) external returns (uint256 out) {
        out = (amountIn * price[address(token)]) / 1e18;
        uint256 available = collateral.balanceOf(address(this));
        if (out > available) {
            out = available;
            amountIn = (out * 1e18) / price[address(token)];
        }
        require(out >= minOut, "MockDex: too little received");
        require(token.transferFrom(msg.sender, address(this), amountIn), "MockDex: pull failed");
        require(collateral.transfer(recipient, out), "MockDex: pay failed");
    }

    function buyExact(OzIERC20 token, uint256 amountOut, uint256 maxIn, address recipient) external returns (uint256) {
        uint256 cost = (amountOut * price[address(token)]) / 1e18;
        require(cost <= maxIn, "MockDex: too much requested");
        require(token.balanceOf(address(this)) >= amountOut, "MockDex: insufficient liquidity");
        require(collateral.transferFrom(msg.sender, address(this), cost), "MockDex: pull failed");
        require(token.transfer(recipient, amountOut), "MockDex: pay failed");
        return cost;
    }
}

contract CompleteSetTraderTest is BaseTest {
    uint256 constant ONE = 1e18;

    Market market;
    MockDex dex;
    CompleteSetTrader trader;
    OzIERC20 sDAI;
    OzIERC20[] outcomeTokens; // 3 outcomes + Invalid
    address user = address(0xBEEF);

    uint256[3] prices = [uint256(0.5e18), uint256(0.3e18), uint256(0.15e18)];

    function setUp() public override {
        super.setUp();

        market = getCategoricalMarket(MIN_BOND, 3);
        sDAI = OzIERC20(collateralToken);
        dex = new MockDex(sDAI);

        address[] memory targets = new address[](1);
        targets[0] = address(dex);
        trader = new CompleteSetTrader(IRouter(address(gnosisRouter)), targets);

        for (uint256 i = 0; i < 4; i++) {
            (IERC20 wrapped,) = market.wrappedOutcome(i);
            outcomeTokens.push(OzIERC20(address(wrapped)));
            if (i < 3) {
                dex.setPrice(address(wrapped), prices[i]);
            }
        }

        // Inventory for the DEX: a complete set of 1000 plus collateral to pay for sells. The rest
        // funds the sets `giveInvalid` splits.
        deal(address(sDAI), address(this), 5000 * ONE);
        sDAI.approve(address(gnosisRouter), 1000 * ONE);
        gnosisRouter.splitPosition(IERC20(address(sDAI)), market, 1000 * ONE);
        for (uint256 i = 0; i < 3; i++) {
            outcomeTokens[i].transfer(address(dex), 1000 * ONE);
        }
        sDAI.transfer(address(dex), 2000 * ONE);
    }

    function sellSwap(uint256 outcome, uint256 amount) internal view returns (CompleteSetTrader.Swap memory) {
        return CompleteSetTrader.Swap({
            target: address(dex),
            data: abi.encodeCall(MockDex.sell, (outcomeTokens[outcome], amount, 0, address(trader)))
        });
    }

    function buySwap(uint256 outcome, uint256 amount) internal view returns (CompleteSetTrader.Swap memory) {
        uint256 maxIn = (amount * prices[outcome]) / ONE;
        return CompleteSetTrader.Swap({
            target: address(dex),
            data: abi.encodeCall(MockDex.buyExact, (outcomeTokens[outcome], amount, maxIn, address(trader)))
        });
    }

    function assertTraderEmpty() internal view {
        assertEq(sDAI.balanceOf(address(trader)), 0, "trader keeps collateral");
        for (uint256 i = 0; i < 4; i++) {
            assertEq(outcomeTokens[i].balanceOf(address(trader)), 0, "trader keeps outcome tokens");
        }
    }

    function giveInvalid(address to, uint256 amount) internal {
        // Split a set and keep only Invalid: the rest goes to the DEX inventory.
        sDAI.approve(address(gnosisRouter), amount);
        gnosisRouter.splitPosition(IERC20(address(sDAI)), market, amount);
        for (uint256 i = 0; i < 3; i++) {
            outcomeTokens[i].transfer(address(dex), amount);
        }
        outcomeTokens[3].transfer(to, amount);
    }

    function emptyTokens() internal pure returns (OzIERC20[] memory tokens, uint256[] memory amounts) {
        tokens = new OzIERC20[](0);
        amounts = new uint256[](0);
    }

    function test_mintAndSellBuysInvalidInOneCall() public {
        uint256 splitAmount = 100 * ONE;
        deal(address(sDAI), user, splitAmount);

        OzIERC20[] memory soldTokens = new OzIERC20[](3);
        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](3);
        for (uint256 i = 0; i < 3; i++) {
            soldTokens[i] = outcomeTokens[i];
            swaps[i] = sellSwap(i, splitAmount);
        }
        (OzIERC20[] memory held, uint256[] memory heldAmounts) = emptyTokens();

        vm.startPrank(user);
        sDAI.approve(address(trader), splitAmount);
        trader.mintAndSell(sDAI, IMarket(address(market)), splitAmount, held, heldAmounts, soldTokens, swaps);
        vm.stopPrank();

        assertEq(outcomeTokens[3].balanceOf(user), splitAmount, "user gets the Invalid tokens");
        // 100 split, 50 + 30 + 15 back: net cost 5.
        assertEq(sDAI.balanceOf(user), 95 * ONE, "sell proceeds come back");
        for (uint256 i = 0; i < 3; i++) {
            assertEq(outcomeTokens[i].balanceOf(user), 0, "sold outcomes are gone");
        }
        assertTraderEmpty();
    }

    function test_mintAndSellRevertsWhenASellFillsPartially() public {
        uint256 splitAmount = 100 * ONE;
        deal(address(sDAI), user, splitAmount);
        // The DEX can only pay 60 collateral: the first sell (50) fills, the second (30) only partly.
        uint256 surplus = sDAI.balanceOf(address(dex)) - 60 * ONE;
        vm.prank(address(dex));
        sDAI.transfer(address(0xdead), surplus);

        OzIERC20[] memory soldTokens = new OzIERC20[](3);
        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](3);
        for (uint256 i = 0; i < 3; i++) {
            soldTokens[i] = outcomeTokens[i];
            swaps[i] = sellSwap(i, splitAmount);
        }
        (OzIERC20[] memory held, uint256[] memory heldAmounts) = emptyTokens();

        vm.startPrank(user);
        sDAI.approve(address(trader), splitAmount);
        vm.expectRevert(bytes("Partial fill"));
        trader.mintAndSell(sDAI, IMarket(address(market)), splitAmount, held, heldAmounts, soldTokens, swaps);
        vm.stopPrank();

        assertEq(sDAI.balanceOf(user), splitAmount, "nothing moved");
    }

    function test_mintAndSellKeepsTheRestOfTheSet() public {
        // mint-to-cover: sell outcome 0 only, minted 60 + 40 already held; outcomes 1, 2 and Invalid stay.
        uint256 splitAmount = 60 * ONE;
        uint256 heldAmount = 40 * ONE;
        deal(address(sDAI), user, splitAmount);
        vm.prank(address(dex));
        outcomeTokens[0].transfer(user, heldAmount);

        OzIERC20[] memory soldTokens = new OzIERC20[](1);
        soldTokens[0] = outcomeTokens[0];
        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](1);
        swaps[0] = sellSwap(0, splitAmount + heldAmount);
        OzIERC20[] memory held = new OzIERC20[](1);
        held[0] = outcomeTokens[0];
        uint256[] memory heldAmounts = new uint256[](1);
        heldAmounts[0] = heldAmount;

        vm.startPrank(user);
        sDAI.approve(address(trader), splitAmount);
        outcomeTokens[0].approve(address(trader), heldAmount);
        trader.mintAndSell(sDAI, IMarket(address(market)), splitAmount, held, heldAmounts, soldTokens, swaps);
        vm.stopPrank();

        assertEq(outcomeTokens[0].balanceOf(user), 0, "the whole position is sold");
        assertEq(sDAI.balanceOf(user), 50 * ONE, "100 sold at 0.5");
        for (uint256 i = 1; i < 4; i++) {
            assertEq(outcomeTokens[i].balanceOf(user), splitAmount, "the rest of the set is swept back");
        }
        assertTraderEmpty();
    }

    function test_buyAndMergeSellsInvalidInOneCall() public {
        uint256 mergeAmount = 100 * ONE;
        giveInvalid(user, mergeAmount);
        uint256 maxCollateralIn = 95 * ONE;
        deal(address(sDAI), user, maxCollateralIn);

        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](3);
        for (uint256 i = 0; i < 3; i++) {
            swaps[i] = buySwap(i, mergeAmount);
        }
        OzIERC20[] memory held = new OzIERC20[](1);
        held[0] = outcomeTokens[3];
        uint256[] memory heldAmounts = new uint256[](1);
        heldAmounts[0] = mergeAmount;

        vm.startPrank(user);
        sDAI.approve(address(trader), maxCollateralIn);
        outcomeTokens[3].approve(address(trader), mergeAmount);
        trader.buyAndMerge(sDAI, IMarket(address(market)), mergeAmount, maxCollateralIn, held, heldAmounts, swaps);
        vm.stopPrank();

        assertEq(outcomeTokens[3].balanceOf(user), 0, "Invalid is merged away");
        // 95 fronted, 95 spent on the buys, 100 back from the merge.
        assertEq(sDAI.balanceOf(user), 100 * ONE, "merge proceeds and unspent collateral come back");
        assertTraderEmpty();
    }

    function test_buyAndMergeUsesTheOutcomesAlreadyHeld() public {
        uint256 mergeAmount = 100 * ONE;
        uint256 heldOutcome = 40 * ONE;
        giveInvalid(user, mergeAmount);
        vm.prank(address(dex));
        outcomeTokens[0].transfer(user, heldOutcome);
        // Buys: 60 of outcome 0 (30), 100 of 1 (30), 100 of 2 (15) = 75, plus 5 of slack.
        uint256 maxCollateralIn = 80 * ONE;
        deal(address(sDAI), user, maxCollateralIn);

        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](3);
        swaps[0] = buySwap(0, mergeAmount - heldOutcome);
        swaps[1] = buySwap(1, mergeAmount);
        swaps[2] = buySwap(2, mergeAmount);
        OzIERC20[] memory held = new OzIERC20[](2);
        held[0] = outcomeTokens[3];
        held[1] = outcomeTokens[0];
        uint256[] memory heldAmounts = new uint256[](2);
        heldAmounts[0] = mergeAmount;
        heldAmounts[1] = heldOutcome;

        vm.startPrank(user);
        sDAI.approve(address(trader), maxCollateralIn);
        outcomeTokens[3].approve(address(trader), mergeAmount);
        outcomeTokens[0].approve(address(trader), heldOutcome);
        trader.buyAndMerge(sDAI, IMarket(address(market)), mergeAmount, maxCollateralIn, held, heldAmounts, swaps);
        vm.stopPrank();

        assertEq(outcomeTokens[0].balanceOf(user), 0, "held outcome went into the merge");
        assertEq(outcomeTokens[3].balanceOf(user), 0, "Invalid went into the merge");
        // 80 fronted - 75 spent + 100 merged.
        assertEq(sDAI.balanceOf(user), 105 * ONE, "unspent slack comes back with the merge");
        assertTraderEmpty();
    }

    function test_buyAndMergeRevertsWhenABuyIsShort() public {
        uint256 mergeAmount = 100 * ONE;
        giveInvalid(user, mergeAmount);
        deal(address(sDAI), user, 95 * ONE);
        // Drain the DEX of outcome 1.
        uint256 inventory = outcomeTokens[1].balanceOf(address(dex));
        vm.prank(address(dex));
        outcomeTokens[1].transfer(address(0xdead), inventory);

        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](3);
        for (uint256 i = 0; i < 3; i++) {
            swaps[i] = buySwap(i, mergeAmount);
        }
        OzIERC20[] memory held = new OzIERC20[](1);
        held[0] = outcomeTokens[3];
        uint256[] memory heldAmounts = new uint256[](1);
        heldAmounts[0] = mergeAmount;

        vm.startPrank(user);
        sDAI.approve(address(trader), 95 * ONE);
        outcomeTokens[3].approve(address(trader), mergeAmount);
        vm.expectRevert(bytes("MockDex: insufficient liquidity"));
        trader.buyAndMerge(sDAI, IMarket(address(market)), mergeAmount, 95 * ONE, held, heldAmounts, swaps);
        vm.stopPrank();
    }

    function test_swapsCannotCallAnythingButTheAllowedRouters() public {
        uint256 splitAmount = 100 * ONE;
        deal(address(sDAI), user, splitAmount);
        // A victim who approved the trader for more than one trade.
        address victim = address(0xCAFE);
        deal(address(sDAI), victim, 1000 * ONE);
        vm.prank(victim);
        sDAI.approve(address(trader), type(uint256).max);

        OzIERC20[] memory soldTokens = new OzIERC20[](1);
        soldTokens[0] = outcomeTokens[0];
        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](1);
        swaps[0] = CompleteSetTrader.Swap({
            target: address(sDAI), data: abi.encodeCall(OzIERC20.transferFrom, (victim, user, 1000 * ONE))
        });
        (OzIERC20[] memory held, uint256[] memory heldAmounts) = emptyTokens();

        vm.startPrank(user);
        sDAI.approve(address(trader), splitAmount);
        vm.expectRevert(bytes("Target not allowed"));
        trader.mintAndSell(sDAI, IMarket(address(market)), splitAmount, held, heldAmounts, soldTokens, swaps);
        vm.stopPrank();

        assertEq(sDAI.balanceOf(victim), 1000 * ONE, "victim untouched");
    }

    function test_swapRevertsBubbleUp() public {
        uint256 splitAmount = 100 * ONE;
        deal(address(sDAI), user, splitAmount);

        OzIERC20[] memory soldTokens = new OzIERC20[](1);
        soldTokens[0] = outcomeTokens[0];
        CompleteSetTrader.Swap[] memory swaps = new CompleteSetTrader.Swap[](1);
        swaps[0] = CompleteSetTrader.Swap({
            target: address(dex),
            data: abi.encodeCall(MockDex.sell, (outcomeTokens[0], splitAmount, 1000 * ONE, address(trader)))
        });
        (OzIERC20[] memory held, uint256[] memory heldAmounts) = emptyTokens();

        vm.startPrank(user);
        sDAI.approve(address(trader), splitAmount);
        vm.expectRevert(bytes("MockDex: too little received"));
        trader.mintAndSell(sDAI, IMarket(address(market)), splitAmount, held, heldAmounts, soldTokens, swaps);
        vm.stopPrank();
    }
}
