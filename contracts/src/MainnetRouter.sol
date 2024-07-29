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

/// @dev Router implementation with functions to interact with DAI on Ethereum Mainnet.
contract MainnetRouter is Router {
    IERC20 public constant DAI =
        IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F); // DAI address
    SavingsDai public constant sDAI =
        SavingsDai(0x83F20F44975D03b1b09e64809B757c47f942BEeA); // SavingsDai address

    /// @dev Constructor
    /// @param _conditionalTokens Conditional Tokens contract
    /// @param _wrappedERC20Factory WrappedERC20Factory contract
    constructor(
        IConditionalTokens _conditionalTokens,
        WrappedERC20Factory _wrappedERC20Factory
    ) Router(_conditionalTokens, _wrappedERC20Factory) {}

    /// @notice Splits a position using DAI and sends the ERC20 outcome tokens back to the user
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition to split
    /// @param partition An array of disjoint index sets used to split the position
    /// @param amount The amount of collateral to split.
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

    /// @notice Merges positions and sends DAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition to merge
    /// @param partition An array of disjoint index sets used to merge the positions
    /// @param amount The amount of outcome tokens to merge
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

    /// @notice Redeems positions and sends DAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrappedERC20Factory.
    /// @param parentCollectionId The Conditional Tokens parent collection id
    /// @param conditionId The id of the condition used to redeem
    /// @param indexSets The index sets of the outcomes to redeem
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
