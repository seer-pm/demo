// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interfaces.sol";

contract LiquidityManager {
    
    IERC20 public immutable sDAI;
    IConditionalTokens public immutable conditionalTokens;
    address public immutable routerAddress;
    address public immutable uniswapRouterAddress;

    // Constructor to initialize immutable variables
    constructor(
        IERC20 _sDAI,
        IConditionalTokens _conditionalTokens,
        address _routerAddress,
        address _uniswapRouterAddress
    ) {
        sDAI = _sDAI;
        conditionalTokens = _conditionalTokens;
        routerAddress = _routerAddress;
        uniswapRouterAddress = _uniswapRouterAddress;
    }

    function addIndexLiquidityToMarket(
        IMarket market,
        uint256 liquidityAmount
    ) external {
        address parentMarket = market.parentMarket();
        bool isConditionalMarket = parentMarket != address(0);
        (IERC20 wrapped1155,) = market.parentWrappedOutcome();
        IERC20 collateral = isConditionalMarket ? wrapped1155 : sDAI;
        bytes32 conditionId = market.conditionId();
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(conditionId);
        sDAI.transferFrom(msg.sender, address(this), liquidityAmount * 2 * (outcomeSlotCount-1));

        for(uint256 i; i<outcomeSlotCount-1; i++){
            
            (IERC20 outcomeToken,) = market.wrappedOutcome(i);
            // Handle conditional market if needed
            if (isConditionalMarket) {
                sDAI.approve(routerAddress, liquidityAmount * 2);
                IRouter(routerAddress).splitPosition(address(sDAI), parentMarket, liquidityAmount * 2);
            }

            // Split position for the market
            collateral.approve(routerAddress, liquidityAmount);
            IRouter(routerAddress).splitPosition(address(sDAI), address(market), liquidityAmount);

            // Approve tokens for Uniswap router
            outcomeToken.approve(uniswapRouterAddress,liquidityAmount);
            collateral.approve(uniswapRouterAddress,liquidityAmount);
            
            // Add liquidity
            IUniswapV2Router(uniswapRouterAddress).addLiquidity(
                address(outcomeToken),
                address(collateral),
                liquidityAmount,
                liquidityAmount,
                liquidityAmount,
                liquidityAmount,
                msg.sender,
                block.timestamp + 1 hours
            );
        }
       
    }
}