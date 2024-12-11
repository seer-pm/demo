// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interfaces.sol";

/// @title TradeManager
/// @dev A specialized contract for swapping and minting Seer market outcome tokens. Handles complex token swapping and minting operations across different markets and tokens.
contract TradeManager {
    /// @dev Dummy address representing xDAI.
    address public constant xDAI =
        address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    /// @dev SavingsXDai contract.
    IERC4626 public constant sDAI =
        IERC4626(0xaf204776c7245bF4147c2612BF6e5972Ee483701);
    /// @dev SwapRouter contract.
    ISingleSwapRouter public constant swaprRouter =
        ISingleSwapRouter(0xfFB643E73f280B97809A8b41f7232AB401a04ee1);
    /// @dev GnosisRouter contract.
    IRouter public constant gnosisRouter =
        IRouter(0xeC9048b59b3467415b1a38F63416407eA0c70fB8);
    /// @dev ConditionalTokens contract.
    IConditionalTokens public constant conditionalTokens =
        IConditionalTokens(0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce);
    /// @dev SavingsXDaiAdapter contract.
    SavingsXDaiAdapter public constant savingsXDaiAdapter =
        SavingsXDaiAdapter(0xD499b51fcFc66bd31248ef4b28d656d67E591A94);
    
    /// @dev Enum to define trade choices between swapping and minting.
    enum TradeChoice {
        Swap,
        Mint
    }
    
    /// @dev Struct to define token path (tokenIn -> tokenOut) for trading.
    /// @param tokenIn Input token address.
    /// @param tokenOut Output token address.
    /// @param tokenInMarket Market of the input token.
    /// @param tokenOutMarket Market of the output token.
    /// @param choice Trade choice (swap or mint).
    struct TokenPath {
        address tokenIn;
        address tokenOut;
        address tokenInMarket;
        address tokenOutMarket;
        TradeChoice choice;
    }

    /// @dev Struct for additional trade parameters.
    /// @param recipient Recipient of the traded tokens.
    /// @param originalRecipient Original intended recipient.
    /// @param deadline Deadline for the trade.
    /// @param amountIn Amount of input tokens.
    /// @param amountOutMinimum Minimum amount of output tokens.
    struct AdditionalTradeParams {
        address recipient;
        address originalRecipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    /// @dev Performs exact input trades across multiple token paths.
    /// @param paths Array of token paths to trade.
    /// @param additionalTradeParams Additional trade parameters.
    /// @return amountOut Total amount of output tokens.
    function exactInput(
        TokenPath[] memory paths,
        AdditionalTradeParams memory additionalTradeParams
    ) public payable returns (uint256 amountOut) {
        uint256 originalAmountOutMinimum = additionalTradeParams
            .amountOutMinimum;
        additionalTradeParams.amountOutMinimum = 0;
        for (uint256 i = 0; i < paths.length; i++) {
            if (i < paths.length - 1) {
                require(
                    paths[i].tokenOut != xDAI,
                    "Token in the middle of a swap cannot be xDAI"
                );
                require(
                    paths[i].tokenOut != address(sDAI),
                    "Token in the middle of a swap cannot be sDAI"
                );
                additionalTradeParams.recipient = address(this);
            } else {
                additionalTradeParams.recipient = additionalTradeParams
                    .originalRecipient;
            }
            amountOut = exactInputSingle(
                paths[i],
                additionalTradeParams,
                i > 0
            );
            additionalTradeParams.amountIn = amountOut;
        }
        require(amountOut >= originalAmountOutMinimum, "Too little received.");
        return amountOut;
    }

    /// @dev Performs a single input trade for a specific token path.
    /// @param path Token path for the trade.
    /// @param additionalTradeParams Additional trade parameters.
    /// @param isFromManager Flag indicating if the trade is initiated from the manager.
    /// @return Amount of output tokens.
    function exactInputSingle(
        TokenPath memory path,
        AdditionalTradeParams memory additionalTradeParams,
        bool isFromManager
    ) public payable returns (uint256 /*amountOut*/) {
        if (path.choice == TradeChoice.Swap) {
            return swapSingle(path, additionalTradeParams, isFromManager);
        }
        return mintSingle(path, additionalTradeParams, isFromManager);
    }

    /// @dev Performs a single token swap.
    /// @param path Token path for the swap.
    /// @param additionalTradeParams Additional trade parameters.
    /// @param isFromManager Flag indicating if the swap is initiated from the manager.
    /// @return Amount of output tokens.
    function swapSingle(
        TokenPath memory path,
        AdditionalTradeParams memory additionalTradeParams,
        bool isFromManager
    ) public payable returns (uint256 /*amountOut*/) {
        ISingleSwapRouter.ExactInputSingleParams
            memory params = ISingleSwapRouter.ExactInputSingleParams({
                tokenIn: path.tokenIn,
                tokenOut: path.tokenOut,
                recipient: additionalTradeParams.recipient,
                deadline: additionalTradeParams.deadline,
                amountIn: additionalTradeParams.amountIn,
                amountOutMinimum: additionalTradeParams.amountOutMinimum,
                limitSqrtPrice: 0
            });
        bool hasTransferTokenIn = false;
        if (params.tokenIn == xDAI) {
            require(msg.value > 0, "Not enough native tokens.");
            params.amountIn = savingsXDaiAdapter.depositXDAI{value: msg.value}(
                address(this)
            );
            params.tokenIn = address(sDAI);
            hasTransferTokenIn = true;
        }
        if (!hasTransferTokenIn && !isFromManager) {
            IERC20(params.tokenIn).transferFrom(
                msg.sender,
                address(this),
                params.amountIn
            );
        }
        IERC20(params.tokenIn).approve(address(swaprRouter), params.amountIn);

        if (params.tokenOut == xDAI) {
            address _recipient = params.recipient;
            params.recipient = address(this);
            params.tokenOut = address(sDAI);

            uint256 sDAIAmountOut = swaprRouter.exactInputSingle(params);
            sDAI.approve(address(savingsXDaiAdapter), sDAIAmountOut);

            return savingsXDaiAdapter.redeemXDAI(sDAIAmountOut, _recipient);
        }

        return swaprRouter.exactInputSingle(params);
    }

    /// @dev Mints full set of market outcome tokens, keep desired outcome tokens while trying to sell the rest to re-buy more desired tokens.
    /// @param path Token path.
    /// @param additionalTradeParams Additional trade parameters.
    /// @param isFromManager Flag indicating if the mint is initiated from the manager.
    /// @return Total amount of tokens after minting + selling/re-buying.
    function mintSingle(
        TokenPath memory path,
        AdditionalTradeParams memory additionalTradeParams,
        bool isFromManager
    ) public payable returns (uint256 /*amountOut*/) {
        require(
            path.tokenOutMarket != address(0),
            "Token out market must not be null."
        );
        address tokenOutParentMarket = IMarket(path.tokenOutMarket)
            .parentMarket();
        require(
            tokenOutParentMarket == address(path.tokenInMarket),
            "Cannot use mint for this pair."
        );
        bool hasTransferTokenIn = false;

        if (path.tokenIn == xDAI) {
            require(msg.value > 0, "Not enough native tokens.");
            additionalTradeParams.amountIn = savingsXDaiAdapter.depositXDAI{
                value: msg.value
            }(address(this));
            path.tokenIn = address(sDAI);
            hasTransferTokenIn = true;
        }

        if (!hasTransferTokenIn && !isFromManager) {
            IERC20(path.tokenIn).transferFrom(
                msg.sender,
                address(this),
                additionalTradeParams.amountIn
            );
        }
        IERC20(path.tokenIn).approve(
            address(gnosisRouter),
            additionalTradeParams.amountIn
        );
        gnosisRouter.splitPosition(
            address(sDAI),
            address(path.tokenOutMarket),
            additionalTradeParams.amountIn
        );

        bytes32 conditionId = IMarket(path.tokenOutMarket).conditionId();
        uint256 outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(
            conditionId
        );
        uint256 tokenInSurplus = 0;
        uint256 totalTokenOut = additionalTradeParams.amountIn;
        // we try to sell other outcomes to tokenIn (or sDai if tokenIn is xDAI) to buy tokenOut again
        for (uint256 j = 0; j < outcomeSlotCount; j++) {
            (IERC20 wrapped1155, ) = IMarket(path.tokenOutMarket)
                .wrappedOutcome(j);

            if (address(wrapped1155) != path.tokenOut) {
                ISingleSwapRouter.ExactInputSingleParams
                    memory params = ISingleSwapRouter.ExactInputSingleParams({
                        tokenIn: address(wrapped1155),
                        tokenOut: path.tokenIn == xDAI
                            ? address(sDAI)
                            : path.tokenIn,
                        recipient: address(this),
                        deadline: additionalTradeParams.deadline,
                        amountIn: additionalTradeParams.amountIn,
                        amountOutMinimum: 0,
                        limitSqrtPrice: 0
                    });
                wrapped1155.approve(
                    address(swaprRouter),
                    additionalTradeParams.amountIn
                );
                try swaprRouter.exactInputSingle(params) returns (
                    uint256 amountOut
                ) {
                    tokenInSurplus += amountOut;
                } catch {
                    require(
                        wrapped1155.transfer(
                            additionalTradeParams.originalRecipient,
                            additionalTradeParams.amountIn
                        ),
                        "Wrapped token transfer failed."
                    );
                }
            }
        }
        if (tokenInSurplus > 0) {
            address tokenIn = path.tokenIn == xDAI
                ? address(sDAI)
                : path.tokenIn;
            ISingleSwapRouter.ExactInputSingleParams
                memory params = ISingleSwapRouter.ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: path.tokenOut,
                    recipient: address(this),
                    deadline: additionalTradeParams.deadline,
                    amountIn: tokenInSurplus,
                    amountOutMinimum: 0,
                    limitSqrtPrice: 0
                });
            IERC20(tokenIn).approve(address(swaprRouter), tokenInSurplus);
            try swaprRouter.exactInputSingle(params) returns (
                uint256 amountOut
            ) {
                totalTokenOut += amountOut;
            } catch {
                if (path.tokenIn == xDAI) {
                    sDAI.approve(address(savingsXDaiAdapter), tokenInSurplus);
                    savingsXDaiAdapter.redeemXDAI(
                        tokenInSurplus,
                        additionalTradeParams.originalRecipient
                    );
                } else {
                    require(
                        IERC20(tokenIn).transfer(
                            additionalTradeParams.originalRecipient,
                            tokenInSurplus
                        ),
                        "Wrapped token transfer failed."
                    );
                }
            }
        }

        // transfer tokenOut to the recipient.
        require(
            IERC20(path.tokenOut).transfer(
                additionalTradeParams.recipient,
                totalTokenOut
            ),
            "Wrapped token transfer failed."
        );

        return totalTokenOut;
    }
}
