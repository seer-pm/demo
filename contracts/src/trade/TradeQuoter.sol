// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interfaces.sol";

/// @dev Contract for generating trade quotes for the Seer trade manager.
contract TradeQuoter {
    /// @dev Dummy address representing xDAI.
    address public constant xDAI =
        address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    /// @dev SavingsXDai contract.
    IERC4626 public constant sDAI =
        IERC4626(0xaf204776c7245bF4147c2612BF6e5972Ee483701);
    /// @dev Quoter contract.
    ISingleQuoter public constant swaprQuoter =
        ISingleQuoter(0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7);
    /// @dev ConditionalTokens contract.
    IConditionalTokens public constant conditionalTokens =
        IConditionalTokens(0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce);

    /// @dev Struct for quote.
    /// @param tokenIn Input token address.
    /// @param tokenOut Output token address.
    /// @param tokenInMarket Market of the input token.
    /// @param tokenOutMarket Market of the output token.
    /// @param amountIn Amount of input token.
    struct QuoteParams {
        address tokenIn;
        address tokenOut;
        address tokenInMarket;
        address tokenOutMarket;
        uint256 amountIn;
    }

    /// @dev Generates a quote for swapping tokens.
    /// @param params Quote parameters.
    /// @return amountOut Amount of output tokens.
    /// @return fee Swap fee.
    function quoteSwapSingle(
        QuoteParams memory params
    ) public returns (uint256 amountOut, uint16 fee) {
        if (params.tokenIn == xDAI) {
            return
                swaprQuoter.quoteExactInputSingle(
                    address(sDAI),
                    params.tokenOut,
                    sDAI.previewDeposit(params.amountIn),
                    0
                );
        }
        if (params.tokenOut == xDAI) {
            (uint256 quotedAmountOut, uint16 quotedFee) = swaprQuoter
                .quoteExactInputSingle(
                    params.tokenIn,
                    address(sDAI),
                    params.amountIn,
                    0
                );
            return (sDAI.previewRedeem(quotedAmountOut), quotedFee);
        }
        return
            swaprQuoter.quoteExactInputSingle(
                params.tokenIn,
                params.tokenOut,
                params.amountIn,
                0
            );
    }

    /// @dev Generates a quote for minting full set of market outcome tokens, keep desired outcome tokens while trying to sell the rest to re-buy more desired tokens.
    /// @param params Quote parameters.
    /// @return amountOut Total amount of output tokens after minting + selling/re-buying.
    /// @return fee Total fee for selling + re-buying.
    function quoteMintSingle(
        QuoteParams memory params
    ) public returns (uint256 amountOut, uint16 fee) {
        require(
            params.tokenOutMarket != address(0),
            "Token out market must not be null."
        );
        address tokenOutParentMarket = IMarket(params.tokenOutMarket)
            .parentMarket();
        require(
            tokenOutParentMarket == address(params.tokenInMarket),
            "Cannot use mint for this pair."
        );
        params.amountIn = params.tokenIn == xDAI
            ? sDAI.previewDeposit(params.amountIn)
            : params.amountIn;
        bytes32 conditionId = IMarket(params.tokenOutMarket).conditionId();
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(
            conditionId
        );
        uint256 tokenInSurplus = 0;
        // in real call it should be able to split all the amountIn to outcome tokens
        uint256 totalTokenOut = params.amountIn;
        (IERC20 wrapped1155, ) = IMarket(params.tokenOutMarket).wrappedOutcome(
            0
        );

        // we try to sell other outcomes to tokenIn (or sDai if tokenIn is xDAI) to buy tokenOut again
        for (uint256 j = 0; j < outcomeSlotCount; j++) {
            (wrapped1155, ) = IMarket(params.tokenOutMarket).wrappedOutcome(j);

            if (address(wrapped1155) != params.tokenOut) {
                try
                    swaprQuoter.quoteExactInputSingle(
                        address(wrapped1155),
                        params.tokenIn == xDAI ? address(sDAI) : params.tokenIn,
                        params.amountIn,
                        0
                    )
                returns (uint256 quotedAmountOut, uint16 quotedFee) {
                    tokenInSurplus += quotedAmountOut;
                    fee+=quotedFee;
                } catch {}
            }
        }
        if (tokenInSurplus > 0) {
            try
                swaprQuoter.quoteExactInputSingle(
                    params.tokenIn == xDAI ? address(sDAI) : params.tokenIn,
                    params.tokenOut,
                    tokenInSurplus,
                    0
                )
            returns (uint256 quotedAmountOut, uint16 quotedFee) {
                totalTokenOut += quotedAmountOut;
                fee+=quotedFee;
            } catch {}
        }
        return (totalTokenOut, fee);
    }
}
