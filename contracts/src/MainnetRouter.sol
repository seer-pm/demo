// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Router.sol";

interface ISavingsDai is IERC20 {
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
}

/// @dev Router implementation with functions to interact with DAI on Ethereum Mainnet.
contract MainnetRouter is Router {
    /// @dev DAI address.
    IERC20 public constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    /// @dev SavingsDai address.
    ISavingsDai public constant sDAI = ISavingsDai(0x83F20F44975D03b1b09e64809B757c47f942BEeA);

    /// @dev Constructor.
    /// @param _conditionalTokens Conditional Tokens contract.
    /// @param _wrapped1155Factory Wrapped1155Factory contract.
    constructor(
        IConditionalTokens _conditionalTokens,
        IWrapped1155Factory _wrapped1155Factory
    ) Router(_conditionalTokens, _wrapped1155Factory) {}

    /// @notice Splits a position using DAI and sends the ERC20 outcome tokens back to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to split.
    /// @param amount The amount of collateral to split.
    function splitFromDai(Market market, uint256 amount) external {
        DAI.transferFrom(msg.sender, address(this), amount);
        DAI.approve(address(sDAI), amount);
        uint256 shares = sDAI.deposit(amount, address(this));

        _splitPosition(IERC20(address(sDAI)), market, shares);
    }

    /// @notice Merges positions and sends DAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to merge.
    /// @param amount The amount of outcome tokens to merge.
    function mergeToDai(Market market, uint256 amount) external {
        _mergePositions(IERC20(address(sDAI)), market, amount);
        sDAI.redeem(amount, msg.sender, address(this));
    }

    /// @notice Redeems positions and sends DAI to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function redeemToDai(Market market, uint256[] calldata outcomeIndexes, uint256[] calldata amounts) external {
        uint256 initialBalance = sDAI.balanceOf(address(this));

        _redeemPositions(sDAI, market, outcomeIndexes, amounts);

        uint256 finalBalance = sDAI.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            sDAI.redeem(finalBalance - initialBalance, msg.sender, address(this));
        }
    }
}
