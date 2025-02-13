// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./FutarchyProposal.sol";
import {IConditionalTokens, IERC20, IWrapped1155Factory} from "./Interfaces.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/// @dev Router implementation that allows to use two collateral tokens.
contract FutarchyRouter is ERC1155Holder {
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
    /// @param proposal The Proposal to split.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount The amount of collateral to split.
    function splitPosition(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public {
        if (proposal.parentCollectionId() == bytes32(0)) {
            // transfer the collateral tokens to the Router.
            collateralToken.transferFrom(msg.sender, address(this), amount);
        }
        _splitPosition(proposal, collateralToken, amount);
    }

    /// @notice Splits a position and sends the ERC20 outcome tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @param proposal The Proposal to split.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount The amount of collateral to split.
    function _splitPosition(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) internal {
        bytes32 parentCollectionId = proposal.parentCollectionId();
        bytes32 conditionId = proposal.conditionId();

        uint256[] memory partition = new uint256[](2);
        partition[0] = 1;
        partition[1] = 2;

        if (parentCollectionId != bytes32(0)) {
            // it's splitting from a parent position, so we need to unwrap these tokens first because they will be burnt to mint the child outcome tokens.
            (IERC20 wrapped1155, bytes memory data) = proposal.parentWrappedOutcome();

            uint256 tokenId = conditionalTokens.getPositionId(address(collateralToken), parentCollectionId);

            wrapped1155.transferFrom(msg.sender, address(this), amount);
            wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amount, address(this), data);
        } else {
            collateralToken.approve(address(conditionalTokens), amount);
        }

        conditionalTokens.splitPosition(address(collateralToken), parentCollectionId, conditionId, partition, amount);

        bool isFirstCollateral = collateralToken == proposal.collateralToken1();

        // wrap & transfer the minted outcome tokens.
        for (uint256 j = 0; j < 2; j++) {
            uint256 tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, 1 << j);

            (IERC20 wrapped1155, bytes memory data) = proposal.wrappedOutcome(isFirstCollateral ? j : j + 2);

            // wrap to erc20.
            conditionalTokens.safeTransferFrom(address(this), address(wrapped1155Factory), tokenId, amount, data);

            // transfer the ERC20 back to the user.
            require(wrapped1155.transfer(msg.sender, amount), "Wrapped token transfer failed");
        }
    }

    /// @notice Merges positions and sends the collateral tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are withdrawn only if we are not merging a deep position (parentCollectionId is bytes32(0)).
    /// @param proposal The Proposal to merge.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount The amount of outcome tokens to merge.
    function mergePositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public {
        _mergePositions(proposal, collateralToken, amount);

        if (proposal.parentCollectionId() == bytes32(0)) {
            // send collateral tokens back to the user.
            require(collateralToken.transfer(msg.sender, amount), "Collateral transfer failed");
        }
    }

    /// @notice Merges positions and receives the collateral tokens.
    /// @dev Callers to this function must send the collateral to the user.
    /// @param proposal The Proposal to merge.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount The amount of outcome tokens to merge.
    function _mergePositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) internal {
        bytes32 parentCollectionId = proposal.parentCollectionId();
        bytes32 conditionId = proposal.conditionId();

        uint256[] memory partition = new uint256[](2);
        partition[0] = 1;
        partition[1] = 2;

        bool isFirstCollateral = collateralToken == proposal.collateralToken1();

        // we need to unwrap the outcome tokens because they will be burnt during the merge.
        for (uint256 j = 0; j < 2; j++) {
            uint256 tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, 1 << j);

            (IERC20 wrapped1155, bytes memory data) = proposal.wrappedOutcome(isFirstCollateral ? j : j + 2);

            wrapped1155.transferFrom(msg.sender, address(this), amount);
            wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amount, address(this), data);
        }

        conditionalTokens.mergePositions(address(collateralToken), parentCollectionId, conditionId, partition, amount);

        if (parentCollectionId != bytes32(0)) {
            // it's merging from a parent position, so we need to wrap these tokens and send them back to the user.
            uint256 tokenId = conditionalTokens.getPositionId(address(collateralToken), parentCollectionId);

            (IERC20 wrapped1155, bytes memory data) = proposal.parentWrappedOutcome();

            // wrap to erc20.
            conditionalTokens.safeTransferFrom(address(this), address(wrapped1155Factory), tokenId, amount, data);

            // transfer the ERC20 back to the user.
            require(wrapped1155.transfer(msg.sender, amount), "Wrapped token transfer failed");
        }
    }

    /// @notice Redeems positions and sends the collateral tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are withdrawn only if we are not redeeming a deep position (parentCollectionId is bytes32(0)).
    /// @param proposal The Proposal to redeem.
    /// @param amount1 Amount to redeem for the first collateral.
    /// @param amount2 Amount to redeem for the second collateral.
    function redeemProposal(FutarchyProposal proposal, uint256 amount1, uint256 amount2) external {
        redeemPositions(proposal, proposal.collateralToken1(), amount1);
        redeemPositions(proposal, proposal.collateralToken2(), amount2);
    }

    /// @notice Redeems positions and sends the collateral tokens to the user.
    /// @dev The ERC20 associated to each outcome must be previously created on the wrapped1155Factory.
    /// @dev Collateral tokens are withdrawn only if we are not redeeming a deep position (parentCollectionId is bytes32(0)).
    /// @param proposal The Proposal to redeem.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount Amount to redeem.
    function redeemPositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) public {
        bytes32 parentCollectionId = proposal.parentCollectionId();
        uint256 initialBalance;

        if (parentCollectionId == bytes32(0)) {
            initialBalance = collateralToken.balanceOf(address(this));
        }

        _redeemPositions(proposal, collateralToken, amount);

        if (parentCollectionId == bytes32(0)) {
            uint256 finalBalance = collateralToken.balanceOf(address(this));

            if (finalBalance > initialBalance) {
                // send collateral tokens back to the user.
                require(
                    collateralToken.transfer(msg.sender, finalBalance - initialBalance), "Collateral transfer failed"
                );
            }
        }
    }

    /// @notice Redeems positions and receives the collateral tokens.
    /// @dev Callers to this function must send the collateral to the user.
    /// @param proposal The Proposal to redeem.
    /// @param collateralToken The address of the ERC20 used as collateral.
    /// @param amount Amount to redeem.
    function _redeemPositions(FutarchyProposal proposal, IERC20 collateralToken, uint256 amount) internal {
        bytes32 parentCollectionId = proposal.parentCollectionId();
        bytes32 conditionId = proposal.conditionId();

        uint256[] memory indexSets = new uint256[](1);
        bool isApproved = conditionalTokens.payoutNumerators(conditionId, 0) == 1;
        uint256 j = isApproved ? 0 : 1;
        indexSets[0] = 1 << j;
        uint256 tokenId = getTokenId(collateralToken, parentCollectionId, conditionId, indexSets[0]);

        // first we need to unwrap the outcome tokens that will be redeemed.
        (IERC20 wrapped1155, bytes memory data) =
            proposal.wrappedOutcome(collateralToken == proposal.collateralToken1() ? j : j + 2);

        wrapped1155.transferFrom(msg.sender, address(this), amount);

        wrapped1155Factory.unwrap(address(conditionalTokens), tokenId, amount, address(this), data);

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
                (IERC20 parentWrapped1155, bytes memory parentData) = proposal.parentWrappedOutcome();

                conditionalTokens.safeTransferFrom(
                    address(this), address(wrapped1155Factory), tokenId, finalBalance - initialBalance, parentData
                );

                // transfer the ERC20 back to the user.
                require(
                    parentWrapped1155.transfer(msg.sender, finalBalance - initialBalance),
                    "Parent wrapped token transfer failed"
                );
            }
        }
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
