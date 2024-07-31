pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "./BaseTest.sol";
import "../src/interaction/Market.sol";
import {MarketView, IMarketFactory} from "../src/interaction/MarketView.sol";
import "forge-std/console.sol";

contract MarketViewTest is BaseTest {

    function test_marketView() public {
        Market categoricalMarket = getCategoricalMarket(MIN_BOND, 10);
        MarketView marketView = new MarketView();
        MarketView.MarketInfo memory marketInfo = marketView.getMarket(IMarketFactory(address(marketFactory)), address(categoricalMarket));
        assertEq(marketInfo.marketName, categoricalMarket.marketName());
    }
}
