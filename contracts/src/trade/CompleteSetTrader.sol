// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Interfaces.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title CompleteSetTrader
/// @notice Trades an outcome through the market's complete set in a single transaction.
/// @dev Buying: split collateral into a full set and sell the other outcomes. Selling: buy the other outcomes and
/// merge the set back into collateral. The swaps are built off-chain (Lens quoter) with this contract as the
/// recipient; each one must target an allowed DEX router, so the allowances users grant this contract can never
/// be spent through an arbitrary call. The contract holds nothing between transactions: everything it ends up
/// with goes back to the caller.
contract CompleteSetTrader {
    struct Swap {
        address target;
        bytes data;
    }

    IRouter public immutable router;

    /// @dev DEX routers the swaps may call. Fixed at deployment, like the venues of the quoter that builds them.
    mapping(address => bool) public allowedTargets;

    event MintAndSell(address indexed user, IMarket indexed market, uint256 splitAmount);
    event BuyAndMerge(address indexed user, IMarket indexed market, uint256 mergeAmount);

    /// @param _router The Seer Router that splits and merges positions.
    /// @param _targets The DEX routers the swaps may call.
    constructor(IRouter _router, address[] memory _targets) {
        router = _router;
        for (uint256 i = 0; i < _targets.length; i++) {
            allowedTargets[_targets[i]] = true;
        }
    }

    /// @notice Splits collateral into a complete set and sells some of its outcomes.
    /// @dev Every sold token must be sold in full: a swap that leaves part of it behind reverts the whole trade, so
    /// the caller never ends up with a partial position at a price other than the quoted one. The outcomes that
    /// are not sold (and the collateral the sells return) are sent back to the caller.
    /// @param collateral The market's collateral.
    /// @param market The market to split.
    /// @param splitAmount The collateral to split.
    /// @param heldTokens Outcome tokens the caller adds to the sale on top of the minted ones (mint-to-cover).
    /// @param heldAmounts The amount of each held token to pull from the caller.
    /// @param soldTokens The outcome tokens sold, one per swap.
    /// @param swaps The swaps, in order, with this contract as recipient.
    function mintAndSell(
        IERC20 collateral,
        IMarket market,
        uint256 splitAmount,
        IERC20[] calldata heldTokens,
        uint256[] calldata heldAmounts,
        IERC20[] calldata soldTokens,
        Swap[] calldata swaps
    ) external {
        require(soldTokens.length == swaps.length, "Sold tokens and swaps mismatch");
        require(heldTokens.length == heldAmounts.length, "Held tokens and amounts mismatch");

        require(collateral.transferFrom(msg.sender, address(this), splitAmount), "Collateral transfer failed");
        for (uint256 i = 0; i < heldTokens.length; i++) {
            require(heldTokens[i].transferFrom(msg.sender, address(this), heldAmounts[i]), "Held token transfer failed");
        }

        require(collateral.approve(address(router), splitAmount), "Collateral approval failed");
        router.splitPosition(address(collateral), address(market), splitAmount);

        for (uint256 i = 0; i < swaps.length; i++) {
            _swap(soldTokens[i], swaps[i]);
            require(soldTokens[i].balanceOf(address(this)) == 0, "Partial fill");
        }

        _sweep(collateral, market);

        emit MintAndSell(msg.sender, market, splitAmount);
    }

    /// @notice Buys the outcomes missing from a complete set and merges it back into collateral.
    /// @dev The collateral for the buys is pulled up front at its slippage limit; whatever the buys do not spend
    /// comes back with the merged collateral. The merge reverts by itself if any outcome is short.
    /// @param collateral The market's collateral.
    /// @param market The market to merge.
    /// @param mergeAmount The number of complete sets to merge.
    /// @param maxCollateralIn The most collateral the buys may spend, added up.
    /// @param heldTokens Outcome tokens the caller already holds and contributes to the set.
    /// @param heldAmounts The amount of each held token to pull from the caller.
    /// @param swaps The exact-output buys, in order, with this contract as recipient.
    function buyAndMerge(
        IERC20 collateral,
        IMarket market,
        uint256 mergeAmount,
        uint256 maxCollateralIn,
        IERC20[] calldata heldTokens,
        uint256[] calldata heldAmounts,
        Swap[] calldata swaps
    ) external {
        require(heldTokens.length == heldAmounts.length, "Held tokens and amounts mismatch");

        require(collateral.transferFrom(msg.sender, address(this), maxCollateralIn), "Collateral transfer failed");
        for (uint256 i = 0; i < heldTokens.length; i++) {
            require(heldTokens[i].transferFrom(msg.sender, address(this), heldAmounts[i]), "Held token transfer failed");
        }

        for (uint256 i = 0; i < swaps.length; i++) {
            _swap(collateral, swaps[i]);
        }

        uint256 tokenCount = market.numOutcomes() + 1;
        for (uint256 j = 0; j < tokenCount; j++) {
            (IERC20 wrapped1155,) = market.wrappedOutcome(j);
            require(wrapped1155.approve(address(router), mergeAmount), "Outcome approval failed");
        }
        router.mergePositions(address(collateral), address(market), mergeAmount);

        _sweep(collateral, market);

        emit BuyAndMerge(msg.sender, market, mergeAmount);
    }

    /// @dev Runs one swap, letting it spend the whole balance of its input token. Bubbles up the router's revert.
    function _swap(IERC20 tokenIn, Swap calldata swap) internal {
        require(allowedTargets[swap.target], "Target not allowed");
        require(tokenIn.approve(swap.target, tokenIn.balanceOf(address(this))), "Swap approval failed");

        (bool success, bytes memory result) = swap.target.call(swap.data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// @dev Sends every outcome token of the market and the collateral this contract holds to the caller.
    function _sweep(IERC20 collateral, IMarket market) internal {
        uint256 tokenCount = market.numOutcomes() + 1;
        for (uint256 j = 0; j < tokenCount; j++) {
            (IERC20 wrapped1155,) = market.wrappedOutcome(j);
            _sendBalance(wrapped1155);
        }
        _sendBalance(collateral);
    }

    function _sendBalance(IERC20 token) internal {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            require(token.transfer(msg.sender, balance), "Token transfer failed");
        }
    }
}
