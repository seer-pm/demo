pragma solidity 0.8.20;

import "../src/Market.sol";
import {IMarketFactory, MarketView} from "../src/MarketView.sol";
import "./BaseTest.sol";
import "forge-std/Test.sol";

import "forge-std/console.sol";

contract MarketViewTest is BaseTest {
    function test_marketView() public {
        Market categoricalMarket = getCategoricalMarket(MIN_BOND, 10);
        Market scalarMarket = getScalarMarket(MIN_BOND, 2, 0, address(categoricalMarket));

        MarketView marketView = new MarketView();

        MarketView.MarketInfo memory marketInfo =
            marketView.getMarket(IMarketFactory(address(marketFactory)), categoricalMarket);
        assertEq(marketInfo.marketName, categoricalMarket.marketName());

        marketInfo = marketView.getMarket(IMarketFactory(address(marketFactory)), scalarMarket);
        assertEq(marketInfo.marketName, scalarMarket.marketName());

        assertEq(marketView.getMarkets(2, IMarketFactory(address(marketFactory))).length, 2);
    }
}
