// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Router.sol";

interface ISavingsXDaiAdapter {
    function depositXDAI(address receiver) external payable returns (uint256);

    function redeemXDAI(uint256 shares, address receiver) external payable returns (uint256);
}

/// @dev Router implementation with functions to interact with xDAI on Gnosis Chain.
contract GnosisRouter is Router {
    /// @dev sDAI address.
    IERC20 public constant sDAI = IERC20(0xaf204776c7245bF4147c2612BF6e5972Ee483701);
    /// @dev SavingsXDaiAdapter address.
    ISavingsXDaiAdapter public constant savingsXDaiAdapter =
        ISavingsXDaiAdapter(0xD499b51fcFc66bd31248ef4b28d656d67E591A94);

    /// @dev Constructor.
    /// @param _conditionalTokens Conditional Tokens contract.
    /// @param _wrapped1155Factory Wrapped1155Factory contract.
    constructor(
        IConditionalTokens _conditionalTokens,
        IWrapped1155Factory _wrapped1155Factory
    ) Router(_conditionalTokens, _wrapped1155Factory) {}

    /// @notice Splits a position using xDAI and sends the ERC20 outcome tokens back to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to split.
    function splitFromBase(Market market) external payable {
        uint256 shares = savingsXDaiAdapter.depositXDAI{value: msg.value}(address(this));

        _splitPosition(sDAI, market, shares);
    }

    /// @notice Merges positions and sends xDAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to merge.
    /// @param amount The amount of outcome tokens to merge.
    function mergeToBase(Market market, uint256 amount) external {
        _mergePositions(sDAI, market, amount);

        sDAI.approve(address(savingsXDaiAdapter), amount);
        savingsXDaiAdapter.redeemXDAI(amount, msg.sender);
    }

    /// @notice Redeems positions and sends xDAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function redeemToBase(Market market, uint256[] calldata outcomeIndexes, uint256[] calldata amounts) external {
        uint256 initialBalance = sDAI.balanceOf(address(this));

        _redeemPositions(sDAI, market, outcomeIndexes, amounts);

        uint256 finalBalance = sDAI.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            sDAI.approve(address(savingsXDaiAdapter), finalBalance - initialBalance);
            savingsXDaiAdapter.redeemXDAI(finalBalance - initialBalance, msg.sender);
        }
    }
}
