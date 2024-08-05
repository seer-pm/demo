// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Interfaces.sol";

/// @title Router token swapping functionality
/// @notice Functions for swapping tokens via Algebra
/// @dev Credit to Uniswap Labs under GPL-2.0-or-later license:
/// https://github.com/Uniswap/v3-periphery
interface ISingleSwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 limitSqrtPrice;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 limitSqrtPrice;
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata
    /// @return amountIn The amount of the input token
    function exactOutputSingle(
        ExactOutputSingleParams calldata params
    ) external payable returns (uint256 amountIn);
}

/// @title Quoter Interface
/// @notice Supports quoting the calculated amounts from exact input or exact output swaps
/// @dev These functions are not marked view because they rely on calling non-view functions and reverting
/// to compute the result. They are also not gas efficient and should not be called on-chain.
/// Credit to Uniswap Labs under GPL-2.0-or-later license:
/// https://github.com/Uniswap/v3-periphery
interface ISingleQuoter {
    /// @notice Returns the amount out received for a given exact input but for a swap of a single pool
    /// @param tokenIn The token being swapped in
    /// @param tokenOut The token being swapped out
    /// @param amountIn The desired input amount
    /// @param limitSqrtPrice The price limit of the pool that cannot be exceeded by the swap
    /// @return amountOut The amount of `tokenOut` that would be received
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint160 limitSqrtPrice
    ) external returns (uint256 amountOut, uint16 fee);

    /// @notice Returns the amount in required to receive the given exact output amount but for a swap of a single pool
    /// @param tokenIn The token being swapped in
    /// @param tokenOut The token being swapped out
    /// @param amountOut The desired output amount
    /// @param limitSqrtPrice The price limit of the pool that cannot be exceeded by the swap
    /// @return amountIn The amount required as the input for the swap in order to receive `amountOut`
    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint160 limitSqrtPrice
    ) external returns (uint256 amountIn, uint16 fee);
}

interface SavingsXDaiAdapter {
    function deposit(
        uint256 assets,
        address receiver
    ) external returns (uint256);

    function depositXDAI(address receiver) external payable returns (uint256);

    function redeem(
        uint256 shares,
        address receiver
    ) external returns (uint256);

    function redeemXDAI(
        uint256 shares,
        address receiver
    ) external payable returns (uint256);
}

interface IERC4626 is IERC20 {
    function previewDeposit(uint256 assets) external view returns (uint256);

    function previewRedeem(uint256 shares) external view returns (uint256);
}

/// @dev Swap Router specialized in swapping outcome tokens with sDAI, xDAI and wxDAI.
/// It expects an OUTCOME_TOKEN<>sDAI pool to exist.
/// 1) When swapping OUTCOME_TOKEN->(w)xDAI, instead of using the route OUTCOME_TOKEN->sDAI->(w)xDAI
/// it does a single swap OUTCOME_TOKEN->sDAI and then redeems the sDAI to (w)xDAI.
/// 2) When swapping (w)xDAI->OUTCOME_TOKEN, instead of using the route (w)xDAI->sDAI->OUTCOME_TOKEN
/// it deposits the (w)xDAI and then does a single swap sDAI->OUTCOME_TOKEN.
/// This way we get a better price than using the sDAI<>wxDAI pool.
contract SwaprSavingsXDaiRouter is ISingleSwapRouter, ISingleQuoter {
    ISingleSwapRouter public constant swaprRouter =
        ISingleSwapRouter(0xfFB643E73f280B97809A8b41f7232AB401a04ee1); // Swapr Router address
    ISingleQuoter public constant swaprQuoter =
        ISingleQuoter(0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7); // Swapr Quoter address

    address public constant xDAI =
        address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE); // dummy xDAI address
    address public constant wxDAI =
        address(0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d); // wxDAI address
    IERC4626 public constant sDAI =
        IERC4626(0xaf204776c7245bF4147c2612BF6e5972Ee483701); // sDAI address

    SavingsXDaiAdapter public constant savingsXDaiAdapter =
        SavingsXDaiAdapter(0xD499b51fcFc66bd31248ef4b28d656d67E591A94); // SavingsXDaiAdapter address

    /// @inheritdoc ISingleQuoter
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint160 limitSqrtPrice
    ) public override returns (uint256 amountOut, uint16 fee) {
        if (tokenIn == xDAI || tokenIn == wxDAI) {
            // (w)xDAI->OUTCOME_TOKEN
            // deposit (w)xDAI to sDAI and quote sDAI<>OUTCOME_TOKEN

            return
                swaprQuoter.quoteExactInputSingle(
                    address(sDAI),
                    tokenOut,
                    sDAI.previewDeposit(amountIn),
                    limitSqrtPrice
                );
        }

        if (tokenOut == xDAI || tokenOut == wxDAI) {
            // OUTCOME_TOKEN->(w)xDAI
            // quote OUTCOME_TOKEN<>sDAI and redeem sDAI for (w)xDAI
            (uint256 quotedAmountOut, uint16 quotedFee) = swaprQuoter
                .quoteExactInputSingle(
                    tokenIn,
                    address(sDAI),
                    amountIn,
                    limitSqrtPrice
                );
            return (sDAI.previewRedeem(quotedAmountOut), quotedFee);
        }

        // OUTCOME_TOKEN<>sDAI
        return
            swaprQuoter.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                amountIn,
                limitSqrtPrice
            );
    }

    /// @inheritdoc ISingleSwapRouter
    function exactInputSingle(
        ExactInputSingleParams memory params
    ) external payable override returns (uint256 /*amountOut*/) {
        if (msg.value == 0) {
            // tokenIn == sDAI, wxDAI or OUTCOME_TOKEN
            IERC20(params.tokenIn).transferFrom(
                msg.sender,
                address(this),
                params.amountIn
            );
            IERC20(params.tokenIn).approve(
                address(swaprRouter),
                params.amountIn
            );
        }

        if (params.tokenIn == xDAI || params.tokenIn == wxDAI) {
            // (w)xDAI->OUTCOME_TOKEN

            // 1) deposit (w)xDAI
            uint256 shares;
            if (msg.value == 0) {
                IERC20(wxDAI).approve(
                    address(savingsXDaiAdapter),
                    params.amountIn
                );
                shares = savingsXDaiAdapter.deposit(
                    params.amountIn,
                    address(this)
                );
            } else {
                shares = savingsXDaiAdapter.depositXDAI{value: msg.value}(
                    address(this)
                );
            }

            // 2) swap sDAI<>OUTCOME_TOKEN
            params.tokenIn = address(sDAI);
            params.amountIn = shares;

            sDAI.approve(address(swaprRouter), params.amountIn);
            return swaprRouter.exactInputSingle(params);
        }

        if (params.tokenOut == xDAI || params.tokenOut == wxDAI) {
            // OUTCOME_TOKEN->(w)xDAI
            address _recipient = params.recipient;
            params.recipient = address(this);

            // 1) swap OUTCOME_TOKEN<>sDAI
            address _tokenOut = params.tokenOut;
            params.tokenOut = address(sDAI);

            uint256 sDAIAmountOut = swaprRouter.exactInputSingle(params);

            // 2) redeem sDAI to (w)xDAI
            sDAI.approve(address(savingsXDaiAdapter), sDAIAmountOut);

            return
                _tokenOut == xDAI
                    ? savingsXDaiAdapter.redeemXDAI(sDAIAmountOut, _recipient)
                    : savingsXDaiAdapter.redeem(sDAIAmountOut, _recipient);
        }

        // OUTCOME_TOKEN<>sDAI
        return swaprRouter.exactInputSingle(params);
    }

    /// @inheritdoc ISingleQuoter
    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint160 limitSqrtPrice
    ) public override returns (uint256 amountIn, uint16 fee) {
        if (tokenIn == xDAI || tokenIn == wxDAI) {
            // (w)xDAI->OUTCOME_TOKEN
            // quote sDAI<>OUTCOME_TOKEN and redeem sDAI for (w)xDAI
            (uint256 quotedAmountIn, uint16 quotedFee) = swaprQuoter
                .quoteExactOutputSingle(
                    address(sDAI),
                    tokenOut,
                    amountOut,
                    limitSqrtPrice
                );
            return (sDAI.previewRedeem(quotedAmountIn), quotedFee);
        }

        if (tokenOut == xDAI || tokenOut == wxDAI) {
            // OUTCOME_TOKEN->(w)xDAI
            // quote OUTCOME_TOKEN<>sDAI and redeem sDAI for (w)xDAI
            return
                swaprQuoter.quoteExactOutputSingle(
                    tokenIn,
                    address(sDAI),
                    sDAI.previewDeposit(amountOut),
                    limitSqrtPrice
                );
        }

        // OUTCOME_TOKEN<>sDAI
        return
            swaprQuoter.quoteExactOutputSingle(
                tokenIn,
                tokenOut,
                amountOut,
                limitSqrtPrice
            );
    }

    /// @inheritdoc ISingleSwapRouter
    function exactOutputSingle(
        ExactOutputSingleParams memory params
    ) external payable override returns (uint256 amountIn) {
        if (msg.value == 0) {
            // tokenIn == sDAI, wxDAI or OUTCOME_TOKEN
            IERC20(params.tokenIn).transferFrom(
                msg.sender,
                address(this),
                params.amountInMaximum
            );
            IERC20(params.tokenIn).approve(
                address(swaprRouter),
                params.amountInMaximum
            );
        }

        if (params.tokenIn == xDAI || params.tokenIn == wxDAI) {
            // (w)xDAI->OUTCOME_TOKEN

            // 1) deposit (w)xDAI
            uint256 shares;
            if (msg.value == 0) {
                IERC20(wxDAI).approve(
                    address(savingsXDaiAdapter),
                    params.amountInMaximum
                );
                shares = savingsXDaiAdapter.deposit(
                    params.amountInMaximum,
                    address(this)
                );
            } else {
                shares = savingsXDaiAdapter.depositXDAI{value: msg.value}(
                    address(this)
                );
            }

            // 2) swap sDAI<>OUTCOME_TOKEN
            uint256 _amountInMaximum = params.amountInMaximum;
            params.tokenIn = address(sDAI);
            params.amountInMaximum = shares;

            sDAI.approve(address(swaprRouter), params.amountInMaximum);
            amountIn = swaprRouter.exactOutputSingle(params);

            uint256 tokenInSurplus = 0;
            if (amountIn < shares) {
                // refund excess (w)xDAI
                sDAI.approve(address(savingsXDaiAdapter), shares - amountIn);

                tokenInSurplus = msg.value > 0
                    ? savingsXDaiAdapter.redeemXDAI(
                        shares - amountIn,
                        params.recipient
                    )
                    : savingsXDaiAdapter.redeem(
                        shares - amountIn,
                        params.recipient
                    );
            }

            return _amountInMaximum - tokenInSurplus;
        }

        if (params.tokenOut == xDAI || params.tokenOut == wxDAI) {
            // OUTCOME_TOKEN->(w)xDAI
            address _recipient = params.recipient;
            params.recipient = address(this);

            // 1) swap to sDAI
            address _tokenOut = params.tokenOut;
            params.tokenOut = address(sDAI);
            params.amountOut = sDAI.previewDeposit(params.amountOut);

            amountIn = swaprRouter.exactOutputSingle(params);

            // 2) redeem sDAI to (w)xDAI
            sDAI.approve(address(savingsXDaiAdapter), params.amountOut);

            _tokenOut == xDAI
                ? savingsXDaiAdapter.redeemXDAI(params.amountOut, _recipient)
                : savingsXDaiAdapter.redeem(params.amountOut, _recipient);

            // transfer back unused tokenIn tokens
            if (params.amountInMaximum > amountIn) {
                IERC20(params.tokenIn).transfer(
                    msg.sender,
                    params.amountInMaximum - amountIn
                );
            }

            return amountIn;
        }

        // OUTCOME_TOKEN<>sDAI
        amountIn = swaprRouter.exactOutputSingle(params);

        // transfer back unused tokenIn tokens
        if (params.amountInMaximum > amountIn) {
            IERC20(params.tokenIn).transfer(
                msg.sender,
                params.amountInMaximum - amountIn
            );
        }

        return amountIn;
    }
}
