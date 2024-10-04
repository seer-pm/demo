/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IConditionalTokens, IERC20, IWrapped1155Factory} from "./Interfaces.sol";
import "./Market.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/// @dev The Router contract replicates the main Conditional Tokens functions, but allowing to work with ERC20 outcomes instead of the ERC1155.
contract Router is ERC1155Holder {
    /// @dev Conditional Tokens contract.
    IConditionalTokens public immutable conditionalTokens;
    /// @dev Wrapped1155Factory contract.
    IWrapped1155Factory public immutable wrapped1155Factory;

    /// @dev Constructor.
    /// @param _conditionalTokens Conditional Tokens contract.
    /// @param _wrapped1155Factory Wrapped1155Factory contract.
    constructor(IConditionalTokens _conditionalTokens, IWrapped1155Factory _wrapped1155Factory) {
        conditionalTokens = _conditionalTokens;
        wrapped1155Factory = _wrapped1155Factory;
    }

    /// @notice Transfers the collateral to the Router, splits the position and sends the ERC20 outcome tokens back to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are deposited only if we are not splitting a deep position (parentCollectionId is bytes32(0)).
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to split.
    /// @param amount The amount of collateral to split.
    function splitPosition(IERC20 collateralToken, Market market, uint256 amount) public {
        if (market.parentCollectionId() == bytes32(0)) {
            // transfer the collateral tokens to the Router.
            collateralToken.transferFrom(msg.sender, address(this), amount);
        }
        _splitPosition(collateralToken, market, amount);
    }

    /// @notice Splits a position and sends the ERC20 outcome tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to split.
    /// @param amount The amount of collateral to split.
    function _splitPosition(IERC20 collateralToken, Market market, uint256 amount) internal {
        bytes32 parentCollectionId = market.parentCollectionId();
        bytes32 conditionId = market.conditionId();

        uint256[] memory partition = getPartition(conditionalTokens.getOutcomeSlotCount(conditionId));

        if (parentCollectionId != bytes32(0)) {
            // it's splitting from a parent position, so we need to unwrap these tokens first because they will be burnt to mint the child outcome tokens.
            (IERC20 wrapped1155, bytes memory data) = market.parentWrappedOutcome();

            uint256 tokenId = conditionalTokens.getPositionId(address(collateralToken), parentCollectionId);

            wrapped1155.transferFrom(msg.sender, address(this), amount);
            wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amount, address(this), data);
        } else {
            collateralToken.approve(address(conditionalTokens), amount);
        }

        conditionalTokens.splitPosition(address(collateralToken), parentCollectionId, conditionId, partition, amount);

        // wrap & transfer the minted outcome tokens.
        for (uint256 j = 0; j < partition.length; j++) {
            uint256 tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, partition[j]);

            (IERC20 wrapped1155, bytes memory data) = market.wrappedOutcome(j);

            // wrap to erc20.
            conditionalTokens.safeTransferFrom(address(this), address(wrapped1155Factory), tokenId, amount, data);

            // transfer the ERC20 back to the user.
            require(wrapped1155.transfer(msg.sender, amount), "Wrapped token transfer failed");
        }
    }

    /// @notice Merges positions and sends the collateral tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are withdrawn only if we are not merging a deep position (parentCollectionId is bytes32(0)).
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to merge.
    /// @param amount The amount of outcome tokens to merge.
    function mergePositions(IERC20 collateralToken, Market market, uint256 amount) public {
        _mergePositions(collateralToken, market, amount);

        if (market.parentCollectionId() == bytes32(0)) {
            // send collateral tokens back to the user.
            require(collateralToken.transfer(msg.sender, amount), "Collateral transfer failed");
        }
    }

    /// @notice Merges positions and receives the collateral tokens.
    /// @dev Callers to this function must send the collateral to the user.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to merge.
    /// @param amount The amount of outcome tokens to merge.
    function _mergePositions(IERC20 collateralToken, Market market, uint256 amount) internal {
        bytes32 parentCollectionId = market.parentCollectionId();
        bytes32 conditionId = market.conditionId();

        uint256[] memory partition = getPartition(conditionalTokens.getOutcomeSlotCount(conditionId));

        // we need to unwrap the outcome tokens because they will be burnt during the merge.

        for (uint256 j = 0; j < partition.length; j++) {
            uint256 tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, partition[j]);

            (IERC20 wrapped1155, bytes memory data) = market.wrappedOutcome(j);

            wrapped1155.transferFrom(msg.sender, address(this), amount);
            wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amount, address(this), data);
        }

        conditionalTokens.mergePositions(address(collateralToken), parentCollectionId, conditionId, partition, amount);

        if (parentCollectionId != bytes32(0)) {
            // it's merging from a parent position, so we need to wrap these tokens and send them back to the user.
            uint256 tokenId = conditionalTokens.getPositionId(address(collateralToken), parentCollectionId);

            (IERC20 wrapped1155, bytes memory data) = market.parentWrappedOutcome();

            // wrap to erc20.
            conditionalTokens.safeTransferFrom(address(this), address(wrapped1155Factory), tokenId, amount, data);

            // transfer the ERC20 back to the user.
            require(wrapped1155.transfer(msg.sender, amount), "Wrapped token transfer failed");
        }
    }

    /// @notice Redeems positions and sends the collateral tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are withdrawn only if we are not redeeming a deep position (parentCollectionId is bytes32(0)).
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function redeemPositions(
        IERC20 collateralToken,
        Market market,
        uint256[] calldata outcomeIndexes,
        uint256[] calldata amounts
    ) public {
        bytes32 parentCollectionId = market.parentCollectionId();
        uint256 initialBalance;

        if (parentCollectionId == bytes32(0)) {
            initialBalance = collateralToken.balanceOf(address(this));
        }

        _redeemPositions(collateralToken, market, outcomeIndexes, amounts);

        if (parentCollectionId == bytes32(0)) {
            uint256 finalBalance = collateralToken.balanceOf(address(this));

            if (finalBalance > initialBalance) {
                // send collateral tokens back to the user.
                require(collateralToken.transfer(msg.sender, finalBalance - initialBalance), "Collateral transfer failed");
            }
        }
    }

    /// @notice Redeems positions and receives the collateral tokens.
    /// @dev Callers to this function must send the collateral to the user.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param market The Market to redeem.
    /// @param outcomeIndexes The index of the outcomes to redeem.
    /// @param amounts Amount to redeem of each outcome.
    function _redeemPositions(
        IERC20 collateralToken,
        Market market,
        uint256[] calldata outcomeIndexes,
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
            // if we are redeeming from a child market, redeemPositions() returned outcome tokens of the parent market. We need to wrap and send them to the user.
            uint256 finalBalance = conditionalTokens.balanceOf(address(this), tokenId);

            if (finalBalance > initialBalance) {
                // wrap to erc20.
                (IERC20 parentWrapped1155, bytes memory parentData) = market.parentWrappedOutcome();

                conditionalTokens.safeTransferFrom(
                    address(this), address(wrapped1155Factory), tokenId, finalBalance - initialBalance, parentData
                );

                // transfer the ERC20 back to the user.
                require(parentWrapped1155.transfer(msg.sender, finalBalance - initialBalance), "Parent wrapped token transfer failed");
            }
        }
    }

    /// @dev Returns a partition containing the full set of outcomes.
    /// @param size Number of outcome slots.
    /// @return The partition containing the full set of outcomes.
    function getPartition(uint256 size) internal pure returns (uint256[] memory) {
        uint256[] memory partition = new uint256[](size);

        for (uint256 i = 0; i < size; i++) {
            partition[i] = 1 << i;
        }

        return partition;
    }

    /// @notice Constructs a tokenId from a collateral token and an outcome collection.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param parentCollectionId The Conditional Tokens parent collection id.
    /// @param conditionId The id of the condition used to redeem.
    /// @param indexSet Index set of the outcome collection to combine with the parent outcome collection.
    /// @return The token id.
    function getTokenId(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) public view returns (uint256) {
        bytes32 collectionId = conditionalTokens.getCollectionId(parentCollectionId, conditionId, indexSet);
        return conditionalTokens.getPositionId(address(collateralToken), collectionId);
    }

    /// @notice Helper function used to know the redeemable outcomes associated to a conditionId.
    /// @param conditionId The id of the condition.
    /// @return An array of outcomes where a true value indicates that the outcome is redeemable.
    function getWinningOutcomes(bytes32 conditionId) external view returns (bool[] memory) {
        bool[] memory result = new bool[](conditionalTokens.getOutcomeSlotCount(conditionId));

        for (uint256 i = 0; i < result.length; i++) {
            result[i] = conditionalTokens.payoutNumerators(conditionId, i) == 0 ? false : true;
        }

        return result;
    }
}
