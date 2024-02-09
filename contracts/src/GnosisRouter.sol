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

contract GnosisRouter is Router {
    SavingsXDaiAdapter public constant savingsXDaiAdapter =
        SavingsXDaiAdapter(0xD499b51fcFc66bd31248ef4b28d656d67E591A94);

    constructor(
        IConditionalTokens _conditionalTokens,
        Wrapped1155Factory _wrapped1155Factory
    ) Router(_conditionalTokens, _wrapped1155Factory) {}

    /// @notice Splits a position using xDAI.
    function splitFromBase(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition
    ) external payable {
        uint256 shares = savingsXDaiAdapter.depositXDAI{value: msg.value}(
            address(this)
        );

        _splitPosition(
            collateralToken,
            parentCollectionId,
            conditionId,
            partition,
            shares
        );
    }

    /// @notice Merges the position and sends xDAI to the user.
    function mergeToBase(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) external {
        _mergePositions(
            collateralToken,
            parentCollectionId,
            conditionId,
            partition,
            amount
        );

        collateralToken.approve(address(savingsXDaiAdapter), amount);
        savingsXDaiAdapter.redeemXDAI(amount, msg.sender);
    }

    // @notice The user sends the outcome tokens and receives xDAI in exchange.
    function redeemToBase(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) external {
        uint256 initialBalance = collateralToken.balanceOf(address(this));

        _redeemPositions(
            collateralToken,
            parentCollectionId,
            conditionId,
            indexSets
        );

        uint256 finalBalance = collateralToken.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            savingsXDaiAdapter.redeemXDAI(
                finalBalance - initialBalance,
                msg.sender
            );
        }
    }
}
