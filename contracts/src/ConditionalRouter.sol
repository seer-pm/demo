// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./Router.sol";

/// @dev Router implementation with functions to redeem conditional positions to collateral.
contract ConditionalRouter is Router {
    /// @dev Constructor.
    /// @param _conditionalTokens Conditional Tokens contract.
    /// @param _wrapped1155Factory Wrapped1155Factory contract.
    constructor(
        IConditionalTokens _conditionalTokens,
        IWrapped1155Factory _wrapped1155Factory
    ) Router(_conditionalTokens, _wrapped1155Factory) {}

    /// @notice Redeems positions and sends collateral to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param parentOutcomeIndexes The index of the parent market outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function redeemConditionalToCollateral(
        IERC20 collateralToken,
        Market market,
        uint256[] calldata outcomeIndexes,
        uint256[] calldata parentOutcomeIndexes,
        uint256[] calldata amounts
    ) public {
        uint256 initialBalance = collateralToken.balanceOf(address(this));

        _redeemConditionalPositions(collateralToken, market, outcomeIndexes, parentOutcomeIndexes, amounts);

        uint256 finalBalance = collateralToken.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            // send collateral tokens back to the user.
            require(collateralToken.transfer(msg.sender, finalBalance - initialBalance), "Collateral transfer failed");
        }
    }

    /// @notice Redeems positions and receives the collateral tokens.
    /// @dev Callers to this function must send the collateral to the user.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param parentOutcomeIndexes The index of the parent market outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function _redeemConditionalPositions(
        IERC20 collateralToken,
        Market market,
        uint256[] calldata outcomeIndexes,
        uint256[] calldata parentOutcomeIndexes,
        uint256[] calldata amounts
    ) internal {
        bytes32 parentCollectionId = market.parentCollectionId();
        bytes32 conditionId = market.conditionId();
        uint256 tokenId = 0;

        uint256[] memory indexSets = new uint256[](outcomeIndexes.length);

        for (uint256 j = 0; j < outcomeIndexes.length; j++) {
            indexSets[j] = 1 << outcomeIndexes[j];
            tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, indexSets[j]);

            // first we need to unwrap the outcome tokens that will be redeemed.
            (IERC20 wrapped1155, bytes memory data) = market.wrappedOutcome(outcomeIndexes[j]);

            wrapped1155.transferFrom(msg.sender, address(this), amounts[j]);

            wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amounts[j], address(this), data);
        }

        uint256 initialBalance = 0;

        if (parentCollectionId != bytes32(0)) {
            // if we are redeeming from a child market, the user may already have parent tokens so we need to track the balance change.
            tokenId = conditionalTokens.getPositionId(address(collateralToken), parentCollectionId);
            initialBalance = conditionalTokens.balanceOf(address(this), tokenId);
        }

        conditionalTokens.redeemPositions(address(collateralToken), parentCollectionId, conditionId, indexSets);

        if (parentCollectionId != bytes32(0)) {
            // if we are redeeming from a child market, redeemPositions() returned outcome tokens of the parent market.
            // We need to continue to redeem these tokens to collateral tokens.
            uint256 finalBalance = conditionalTokens.balanceOf(address(this), tokenId);
            if (finalBalance > initialBalance) {
                _redeemToCollateral(collateralToken, market, parentOutcomeIndexes);
            }
        }
    }

    /// @notice Separate the second redeem to avoid 'Stack too deep'
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to redeem.
    /// @param parentOutcomeIndexes The index of the parent market outcomes to redeem.
    function _redeemToCollateral(
        IERC20 collateralToken,
        Market market,
        uint256[] calldata parentOutcomeIndexes
    ) internal {
        bytes32 parentMarketParentCollectionId = Market(market.parentMarket()).parentCollectionId();
        require(parentMarketParentCollectionId == bytes32(0), "Parent market cannot be conditional");
        bytes32 parentMarketConditionId = Market(market.parentMarket()).conditionId();

        uint256[] memory parentMarketIndexSets = new uint256[](parentOutcomeIndexes.length);
        for (uint256 i = 0; i < parentOutcomeIndexes.length; i++) {
            parentMarketIndexSets[i] = 1 << parentOutcomeIndexes[i];
        }
        conditionalTokens.redeemPositions(
            address(collateralToken), parentMarketParentCollectionId, parentMarketConditionId, parentMarketIndexSets
        );
    }
}
