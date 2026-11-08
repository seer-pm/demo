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
    ISingleQuoter public immutable swaprQuoter;
    /// @dev ConditionalTokens contract.
    IConditionalTokens public immutable conditionalTokens;

    /// @dev Struct for quote.
    /// @param tokenIn Input token address.
    /// @param tokenOut Output token address.
    /// @param amountIn Amount of input token.
    struct QuoteParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
    }

    /// @dev Constructor.
    /// @param _swaprQuoter Quoter contract.
    /// @param _conditionalTokens ConditionalTokens contract.
    constructor(
        ISingleQuoter _swaprQuoter,
        IConditionalTokens _conditionalTokens
    ) {
        swaprQuoter = _swaprQuoter;
        conditionalTokens = _conditionalTokens;
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
}