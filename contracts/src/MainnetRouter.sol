// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Router.sol";

interface SavingsDai is IERC20 {
    function deposit(
        uint256 assets,
        address receiver
    ) external returns (uint256 shares);

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external returns (uint256 assets);
}

contract MainnetRouter is Router {
    IERC20 public constant DAI =
        IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    SavingsDai public constant sDAI =
        SavingsDai(0x83F20F44975D03b1b09e64809B757c47f942BEeA);

    constructor(
        IConditionalTokens _conditionalTokens,
        Wrapped1155Factory _wrapped1155Factory
    ) Router(_conditionalTokens, _wrapped1155Factory) {}

    /// @notice Splits a position using DAI.
    function splitFromDai(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) external {
        DAI.transferFrom(msg.sender, address(this), amount);
        DAI.approve(address(sDAI), amount);
        uint256 shares = sDAI.deposit(amount, address(this));

        _splitPosition(
            IERC20(address(sDAI)),
            parentCollectionId,
            conditionId,
            partition,
            shares
        );
    }

    /// @notice Merges the position and sends DAI to the user.
    function mergeToDai(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) external {
        _mergePositions(
            IERC20(address(sDAI)),
            parentCollectionId,
            conditionId,
            partition,
            amount
        );
        sDAI.redeem(amount, msg.sender, address(this));
    }

    /// @notice The user sends the outcome tokens and receives DAI in exchange.
    function redeemToDai(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) external {
        uint256 initialBalance = sDAI.balanceOf(address(this));

        _redeemPositions(sDAI, parentCollectionId, conditionId, indexSets);

        uint256 finalBalance = sDAI.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            sDAI.redeem(
                finalBalance - initialBalance,
                msg.sender,
                address(this)
            );
        }
    }
}
