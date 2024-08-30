// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Router.sol";

interface SavingsXDaiAdapter {
    function depositXDAI(address receiver) external payable returns (uint256);

    function redeemXDAI(
        uint256 shares,
        address receiver
    ) external payable returns (uint256);
}

/// @dev Router implementation with functions to interact with xDAI on Gnosis Chain.
contract GnosisRouter is Router {
    IERC20 public constant sDAI =
        IERC20(0xaf204776c7245bF4147c2612BF6e5972Ee483701); // sDAI address
    SavingsXDaiAdapter public constant savingsXDaiAdapter =
        SavingsXDaiAdapter(0xD499b51fcFc66bd31248ef4b28d656d67E591A94); // SavingsXDaiAdapter address

    /// @dev Constructor
    /// @param _conditionalTokens Conditional Tokens contract
    /// @param _wrappedERC20Factory WrappedERC20Factory contract
    constructor(
        IConditionalTokens _conditionalTokens,
        WrappedERC20Factory _wrappedERC20Factory
    ) Router(_conditionalTokens, _wrappedERC20Factory) {}

    /// @notice Splits a position using xDAI and sends the ERC20 outcome tokens back to the user
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition to split
    function splitFromBase(
        bytes32 parentCollectionId,
        bytes32 conditionId
    ) external payable {
        uint256 shares = savingsXDaiAdapter.depositXDAI{value: msg.value}(
            address(this)
        );

        _splitPosition(sDAI, parentCollectionId, conditionId, shares);
    }

    /// @notice Merges positions and sends xDAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition to merge
    /// @param amount The amount of outcome tokens to merge
    function mergeToBase(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint amount
    ) external {
        _mergePositions(sDAI, parentCollectionId, conditionId, amount);

        sDAI.approve(address(savingsXDaiAdapter), amount);
        savingsXDaiAdapter.redeemXDAI(amount, msg.sender);
    }

    /// @notice Redeems positions and sends xDAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory.
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition used to redeem
    /// @param indexSets The index sets of the outcomes to redeem
    function redeemToBase(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) external {
        uint256 initialBalance = sDAI.balanceOf(address(this));

        _redeemPositions(sDAI, parentCollectionId, conditionId, indexSets);

        uint256 finalBalance = sDAI.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            sDAI.approve(
                address(savingsXDaiAdapter),
                finalBalance - initialBalance
            );
            savingsXDaiAdapter.redeemXDAI(
                finalBalance - initialBalance,
                msg.sender
            );
        }
    }
}
