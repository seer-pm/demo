// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./TradeQuoter.sol";

/// @dev Contract for recursive rebuy strategy optimization using TradeQuoter.
contract RecursiveQuoter {
    /// @dev The base TradeQuoter contract.
    TradeQuoter public immutable tradeQuoter;

    /// @dev Algebra Factory address
    IAlgebraFactory public immutable algebraFactory;

    /// @dev Minimum liquidity threshold
    uint128 public constant MIN_LIQUIDITY = 1000;

    /// @dev Struct for recursive rebuy parameters.
    struct RebuyParams {
        address targetToken; // The token we want to maximize
        address collateralToken; // Collateral token (C)
        address targetMarket; // Market of the target token
        address collateralMarket; // Market of the collateral token, zero address if none
        uint256 initialTargetAmount; // Initial amount of target token
        uint256[] initialOutcomeAmounts; // Initial amounts of all outcome tokens (including target)
        uint256 collateralAmount; // Amount of collateral available
        uint256 recursionDepth; // Current recursion depth
        uint256 maxRecursionDepth; // Max recursion depth
    }

    /// @dev Simplified struct for chained rebuy parameters (public interface).
    struct ChainedRebuyParams {
        address targetToken; // The token we want to maximize
        address collateralToken; // Collateral token (C)
        address targetMarket; // Market of the target token
        address collateralMarket; // Market of the collateral token, zero address if none
        uint256 maxRecursionDepth; // Max recursion depth
    }

    /// @dev Struct for individual execution step.
    struct ExecutionStep {
        uint8 action; // 0 = swap, 1 = mint
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint16 fee;
    }

    /// @dev Struct for strategy result with execution sequence.
    struct StrategyResult {
        uint256 finalAmount;
        uint16 totalFee;
        ExecutionStep[] steps;
    }

    /// @dev Mapping for tracking accumulated amount in within one execution.
    mapping(uint256 => mapping(bytes32 => uint256)) private accumulatedAmountIn;

    /// @dev Mapping for tracking previous amount out within one execution.
    mapping(uint256 => mapping(bytes32 => uint256)) private previousAmountOut;

    /// @dev Adding execution id to make sure the result of each recursive call won't affect the others.
    uint256 private nextExecutionId = 1;

    /// @dev Constructor.
    constructor(TradeQuoter _tradeQuoter, IAlgebraFactory _algebraFactory) {
        tradeQuoter = _tradeQuoter;
        algebraFactory = _algebraFactory;
    }

    /// @dev Check if a token pair has any liquidity
    function _hasLiquidity(
        address tokenA,
        address tokenB
    ) internal view returns (bool) {
        address poolAddress = algebraFactory.poolByPair(tokenA, tokenB);

        if (poolAddress == address(0)) {
            return false;
        }

        try IAlgebraPool(poolAddress).liquidity() returns (
            uint128 poolLiquidity
        ) {
            return poolLiquidity > MIN_LIQUIDITY;
        } catch {
            return false;
        }
    }

    function _accumulatedQuote(
        TradeQuoter.QuoteParams memory params
    ) internal returns (uint256, uint16) {
        // Check liquidity before attempting swap
        if (!_hasLiquidity(params.tokenIn, params.tokenOut)) {
            return (0, 0);
        }

        bytes32 tradeKey = keccak256(
            abi.encodePacked(params.tokenIn, params.tokenOut)
        );
        accumulatedAmountIn[nextExecutionId][tradeKey] += params.amountIn;
        try
            tradeQuoter.quoteSwapSingle(
                TradeQuoter.QuoteParams({
                    tokenIn: params.tokenIn,
                    tokenOut: params.tokenOut,
                    amountIn: accumulatedAmountIn[nextExecutionId][tradeKey]
                })
            )
        returns (uint256 totalAmountOut, uint16 fee) {
            // Get cached previous output
            uint256 cachedPreviousOut = previousAmountOut[nextExecutionId][
                tradeKey
            ];

            // Calculate marginal output
            uint256 marginalAmountOut = totalAmountOut > cachedPreviousOut
                ? totalAmountOut - cachedPreviousOut
                : 0;

            // Cache this result for next call
            previousAmountOut[nextExecutionId][tradeKey] = totalAmountOut;

            return (marginalAmountOut, fee);
        } catch {
            return (0, 0);
        }
    }

    /// @dev Get all outcome tokens for a market.
    function _getOutcomeTokens(
        address market
    )
        internal
        view
        returns (address[] memory outcomeTokens, uint256 outcomeCount)
    {
        bytes32 conditionId = IMarket(market).conditionId();
        outcomeCount = tradeQuoter.conditionalTokens().getOutcomeSlotCount(
            conditionId
        );
        outcomeTokens = new address[](outcomeCount);

        for (uint256 i = 0; i < outcomeCount; i++) {
            (IERC20 wrapped1155, ) = IMarket(market).wrappedOutcome(i);
            outcomeTokens[i] = address(wrapped1155);
        }
    }

    /// @dev Get direct swap result with execution step.
    function _getDirectSwapResult(
        RebuyParams memory params
    ) internal returns (StrategyResult memory result) {
        (uint256 swapOut, uint16 fee) = _accumulatedQuote(
            TradeQuoter.QuoteParams({
                tokenIn: params.collateralToken,
                tokenOut: params.targetToken,
                amountIn: params.collateralAmount
            })
        );

        result.finalAmount = params.initialTargetAmount + swapOut;
        result.totalFee = fee;
        result.steps = new ExecutionStep[](1);
        result.steps[0] = ExecutionStep({
            action: 0, // swap
            tokenIn: params.collateralToken,
            tokenOut: params.targetToken,
            amountIn: params.collateralAmount,
            amountOut: swapOut,
            fee: fee
        });
    }

    /// @dev Check if mint strategy is possible.
    function _canUseMintStrategy(
        address targetMarket,
        address collateralMarket
    ) internal view returns (bool) {
        return
            targetMarket != address(0) &&
            IMarket(targetMarket).parentMarket() == collateralMarket;
    }

    /// @dev Calculate sell steps for all non-target outcomes.
    function _calculateSellSteps(
        address[] memory outcomeTokens,
        uint256[] memory outcomeAmounts,
        address targetToken,
        address collateralToken
    )
        internal
        returns (
            ExecutionStep[] memory sellSteps,
            uint256 totalCollateral,
            uint16 totalFee
        )
    {
        // Count non-target outcomes with amounts > 0
        uint256 sellCount = 0;
        for (uint256 i = 0; i < outcomeTokens.length; i++) {
            if (outcomeTokens[i] != targetToken && outcomeAmounts[i] > 0) {
                sellCount++;
            }
        }

        sellSteps = new ExecutionStep[](sellCount);
        uint256 stepIndex = 0;

        for (uint256 i = 0; i < outcomeTokens.length; i++) {
            if (outcomeTokens[i] != targetToken && outcomeAmounts[i] > 0) {
                (uint256 collateralOut, uint16 fee) = _accumulatedQuote(
                    TradeQuoter.QuoteParams({
                        tokenIn: outcomeTokens[i],
                        tokenOut: collateralToken,
                        amountIn: outcomeAmounts[i]
                    })
                );

                sellSteps[stepIndex] = ExecutionStep({
                    action: 0, // swap
                    tokenIn: outcomeTokens[i],
                    tokenOut: collateralToken,
                    amountIn: outcomeAmounts[i],
                    amountOut: collateralOut,
                    fee: fee
                });

                totalCollateral += collateralOut;
                totalFee += fee;
                stepIndex++;
            }
        }
    }

    /// @dev Combine execution steps arrays.
    function _combineSteps(
        ExecutionStep[] memory steps1,
        ExecutionStep[] memory steps2
    ) internal pure returns (ExecutionStep[] memory combinedSteps) {
        combinedSteps = new ExecutionStep[](steps1.length + steps2.length);

        for (uint256 i = 0; i < steps1.length; i++) {
            combinedSteps[i] = steps1[i];
        }

        for (uint256 i = 0; i < steps2.length; i++) {
            combinedSteps[steps1.length + i] = steps2[i];
        }
    }

    /// @dev Execute mint strategy logic.
    function _getMintResult(
        RebuyParams memory params
    ) internal returns (StrategyResult memory result) {
        // Calculate collateral for minting
        uint256 collateralForMint = params.collateralAmount;
        if (params.collateralToken == tradeQuoter.xDAI()) {
            collateralForMint = tradeQuoter.sDAI().previewDeposit(
                params.collateralAmount
            );
        }

        // Get all outcome tokens
        (
            address[] memory outcomeTokens,
            uint256 outcomeCount
        ) = _getOutcomeTokens(params.targetMarket);
        require(
            params.initialOutcomeAmounts.length == outcomeCount,
            "Provide initial amounts for all outcomes."
        );

        // Calculate new outcome amounts after minting
        uint256[] memory newOutcomeAmounts = new uint256[](outcomeCount);
        uint256 newTargetAmount = params.initialTargetAmount;

        for (uint256 i = 0; i < outcomeCount; i++) {
            newOutcomeAmounts[i] =
                params.initialOutcomeAmounts[i] +
                collateralForMint;
            // Update target amount if this is the target token
            if (outcomeTokens[i] == params.targetToken) {
                newTargetAmount = newOutcomeAmounts[i];
            }
        }

        // Create mint step
        ExecutionStep memory mintStep = ExecutionStep({
            action: 1, // mint
            tokenIn: params.collateralToken,
            tokenOut: params.targetToken,
            amountIn: params.collateralAmount,
            amountOut: collateralForMint, // Amount of target token gained from minting
            fee: 0
        });

        // Calculate sell steps for all non-target outcomes
        (
            ExecutionStep[] memory sellSteps,
            uint256 collateralFromOutcomes,
            uint16 sellFee
        ) = _calculateSellSteps(
                outcomeTokens,
                newOutcomeAmounts,
                params.targetToken,
                params.collateralToken
            );

        if (collateralFromOutcomes > 0) {
            // Create zero array for next iteration (all non-target tokens sold)
            uint256[] memory zeroAmounts = new uint256[](outcomeCount);
            for (uint256 i = 0; i < outcomeCount; i++) {
                if (outcomeTokens[i] == params.targetToken) {
                    zeroAmounts[i] = newTargetAmount;
                }
            }

            // Prepare recursive parameters
            RebuyParams memory nextParams = RebuyParams({
                targetToken: params.targetToken,
                collateralToken: params.collateralToken,
                targetMarket: params.targetMarket,
                collateralMarket: params.collateralMarket,
                initialTargetAmount: newTargetAmount,
                initialOutcomeAmounts: zeroAmounts,
                collateralAmount: collateralFromOutcomes,
                recursionDepth: params.recursionDepth + 1,
                maxRecursionDepth: params.maxRecursionDepth
            });

            StrategyResult memory nextResult = _quoteRecursiveRebuyInternal(
                nextParams
            );

            result.finalAmount = nextResult.finalAmount;
            result.totalFee = sellFee + nextResult.totalFee;

            // Combine steps: mint + sells + recursive steps
            ExecutionStep[] memory mintArray = new ExecutionStep[](1);
            mintArray[0] = mintStep;

            ExecutionStep[] memory firstPart = _combineSteps(
                mintArray,
                sellSteps
            );
            result.steps = _combineSteps(firstPart, nextResult.steps);
        } else {
            // Mint only, no further optimization possible
            result.finalAmount = newTargetAmount;
            result.totalFee = 0;
            result.steps = new ExecutionStep[](1);
            result.steps[0] = mintStep;
        }
    }

    /// @dev Recursive rebuy function with execution sequence tracking.
    function _quoteRecursiveRebuyInternal(
        RebuyParams memory params
    ) internal returns (StrategyResult memory) {
        // Base case: recursion limit reached
        if (params.recursionDepth >= params.maxRecursionDepth) {
            return _getDirectSwapResult(params);
        }

        // Get direct swap result
        StrategyResult memory directResult = _getDirectSwapResult(params);

        // Check mint strategy feasibility
        if (
            !_canUseMintStrategy(params.targetMarket, params.collateralMarket)
        ) {
            return directResult;
        }

        // Get mint strategy result
        StrategyResult memory mintResult = _getMintResult(params);

        // Return better option
        return
            (mintResult.finalAmount > directResult.finalAmount)
                ? mintResult
                : directResult;
    }

    /// @dev Enhanced chained recursive rebuy function with simplified parameters.
    /// @notice Call this function using static call to save gas and avoid state changes.
    /// @param chainedParamsArray Array of ChainedRebuyParams to execute in sequence
    /// @param initialCollateralAmount Initial collateral amount for the first step
    /// @return result Combined StrategyResult with merged execution steps
    function quoteRecursiveRebuy(
        ChainedRebuyParams[] memory chainedParamsArray,
        uint256 initialCollateralAmount
    ) external returns (StrategyResult memory result) {
        require(chainedParamsArray.length > 0, "Empty params array");
        require(initialCollateralAmount > 0, "Invalid initial amount");

        // Convert first ChainedRebuyParams to RebuyParams for internal use
        RebuyParams memory firstParams = RebuyParams({
            targetToken: chainedParamsArray[0].targetToken,
            collateralToken: chainedParamsArray[0].collateralToken,
            targetMarket: chainedParamsArray[0].targetMarket,
            collateralMarket: chainedParamsArray[0].collateralMarket,
            initialTargetAmount: 0,
            initialOutcomeAmounts: _getZeroOutcomeAmounts(
                chainedParamsArray[0].targetMarket
            ),
            collateralAmount: initialCollateralAmount,
            recursionDepth: 0,
            maxRecursionDepth: chainedParamsArray[0].maxRecursionDepth
        });

        // Initialize result with first rebuy
        result = _quoteRecursiveRebuyInternal(firstParams);

        // Store the target token from previous step for validation
        address previousTargetToken = chainedParamsArray[0].targetToken;

        // Process remaining rebuys in sequence
        for (uint256 i = 1; i < chainedParamsArray.length; i++) {
            ChainedRebuyParams memory currentChainedParams = chainedParamsArray[
                i
            ];

            // Validate that collateral token of current step matches target token of previous step
            require(
                currentChainedParams.collateralToken == previousTargetToken,
                "Invalid token chain: collateral must match previous target"
            );

            // Convert ChainedRebuyParams to RebuyParams for internal use
            RebuyParams memory currentParams = RebuyParams({
                targetToken: currentChainedParams.targetToken,
                collateralToken: currentChainedParams.collateralToken,
                targetMarket: currentChainedParams.targetMarket,
                collateralMarket: currentChainedParams.collateralMarket,
                initialTargetAmount: 0, // Always start fresh
                initialOutcomeAmounts: _getZeroOutcomeAmounts(
                    currentChainedParams.targetMarket
                ),
                collateralAmount: result.finalAmount, // Use result from previous step
                recursionDepth: 0, // Reset recursion depth for each step
                maxRecursionDepth: currentChainedParams.maxRecursionDepth
            });

            // Execute current rebuy
            StrategyResult memory currentResult = _quoteRecursiveRebuyInternal(
                currentParams
            );

            // Merge results
            result.finalAmount = currentResult.finalAmount;
            result.totalFee += currentResult.totalFee;
            result.steps = _combineSteps(result.steps, currentResult.steps);

            // Update previous target token for next iteration
            previousTargetToken = currentChainedParams.targetToken;
        }

        // Reset for next execution
        nextExecutionId += 1;
    }

    /// @dev Helper function to get zero outcome amounts for a market.
    function _getZeroOutcomeAmounts(
        address market
    ) internal view returns (uint256[] memory) {
        if (market == address(0)) {
            return new uint256[](0);
        }

        (, uint256 outcomeCount) = _getOutcomeTokens(market);
        return new uint256[](outcomeCount);
    }

    /// @dev Get the underlying TradeQuoter.
    function getTradeQuoter() external view returns (TradeQuoter) {
        return tradeQuoter;
    }
}
