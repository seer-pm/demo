// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IConditionalTokens, Wrapped1155Factory, IERC20} from "./Interfaces.sol";

contract Router is ERC1155Holder {
    // this needs to be the same ERC20_DATA used by MarketFactory
    bytes internal constant ERC20_DATA =
        hex"5365657200000000000000000000000000000000000000000000000000000008534545520000000000000000000000000000000000000000000000000000000812";

    IConditionalTokens public conditionalTokens;
    Wrapped1155Factory public wrapped1155Factory;

    constructor(
        IConditionalTokens _conditionalTokens,
        Wrapped1155Factory _wrapped1155Factory
    ) {
        conditionalTokens = _conditionalTokens;
        wrapped1155Factory = _wrapped1155Factory;
    }

    // @notice Transfers the collateral to the Router and then splits the position.
    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) public {
        IERC20(collateralToken).transferFrom(msg.sender, address(this), amount);
        _splitPosition(
            collateralToken,
            parentCollectionId,
            conditionId,
            partition,
            amount
        );
    }

    // @notice Splits a position and sends the outcome tokens to the user.
    function _splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) internal {
        IERC20(collateralToken).approve(address(conditionalTokens), amount);

        conditionalTokens.splitPosition(
            address(collateralToken),
            parentCollectionId,
            conditionId,
            partition,
            amount
        );

        for (uint j = 0; j < partition.length; j++) {
            uint256 tokenId = getTokenId(
                collateralToken,
                parentCollectionId,
                conditionId,
                partition[j]
            );

            // wrap to erc20
            conditionalTokens.safeTransferFrom(
                address(this),
                address(wrapped1155Factory),
                tokenId,
                amount,
                ERC20_DATA
            );

            IERC20 wrapped1155 = wrapped1155Factory.requireWrapped1155(
                address(conditionalTokens),
                tokenId,
                ERC20_DATA
            );

            // transfer the ERC20 back to the user
            wrapped1155.transfer(msg.sender, amount);
        }
    }

    // @notice Merges positions and sends the collateral tokens to the user.
    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) public {
        _mergePositions(
            collateralToken,
            parentCollectionId,
            conditionId,
            partition,
            amount
        );
        collateralToken.transfer(msg.sender, amount);
    }

    // @notice Merges positions and receives the collateral tokens.
    // @dev callers to this function must send the collateral to the user.
    function _mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) internal {
        for (uint j = 0; j < partition.length; j++) {
            uint256 tokenId = getTokenId(
                collateralToken,
                parentCollectionId,
                conditionId,
                partition[j]
            );

            // unwrap ERC20
            IERC20 wrapped1155 = wrapped1155Factory.requireWrapped1155(
                address(conditionalTokens),
                tokenId,
                ERC20_DATA
            );

            wrapped1155.transferFrom(msg.sender, address(this), amount);

            wrapped1155Factory.unwrap(
                address(conditionalTokens),
                tokenId,
                amount,
                address(this),
                ERC20_DATA
            );
        }

        conditionalTokens.mergePositions(
            address(collateralToken),
            parentCollectionId,
            conditionId,
            partition,
            amount
        );
    }

    // @notice Redeems positions and sends the collateral tokens to the user.
    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) public {
        uint256 initialBalance = collateralToken.balanceOf(address(this));

        _redeemPositions(
            collateralToken,
            parentCollectionId,
            conditionId,
            indexSets
        );

        uint256 finalBalance = collateralToken.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            collateralToken.transfer(msg.sender, finalBalance - initialBalance);
        }
    }

    // @notice Redeems positions and receives the collateral tokens.
    // @dev Callers to this function must send the collateral to the user.
    function _redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) internal {
        for (uint j = 0; j < indexSets.length; j++) {
            uint256 tokenId = getTokenId(
                collateralToken,
                parentCollectionId,
                conditionId,
                indexSets[j]
            );

            // unwrap ERC20
            IERC20 wrapped1155 = wrapped1155Factory.requireWrapped1155(
                address(conditionalTokens),
                tokenId,
                ERC20_DATA
            );

            uint256 amount = wrapped1155.balanceOf(msg.sender);

            wrapped1155.transferFrom(msg.sender, address(this), amount);

            wrapped1155Factory.unwrap(
                address(conditionalTokens),
                tokenId,
                amount,
                address(this),
                ERC20_DATA
            );
        }

        conditionalTokens.redeemPositions(
            address(collateralToken),
            parentCollectionId,
            conditionId,
            indexSets
        );
    }

    // @notice Constructs a tokenId from a collateral token and an outcome collection.
    function getTokenId(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint indexSet
    ) public view returns (uint256) {
        bytes32 collectionId = conditionalTokens.getCollectionId(
            parentCollectionId,
            conditionId,
            indexSet
        );
        return
            conditionalTokens.getPositionId(
                address(collateralToken),
                collectionId
            );
    }

    // @notice Returns the address of the ERC-20 associated to the ERC-1155 outcome token.
    function getTokenAddress(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint indexSet
    ) external returns (IERC20) {
        return
            wrapped1155Factory.requireWrapped1155(
                address(conditionalTokens),
                getTokenId(
                    collateralToken,
                    parentCollectionId,
                    conditionId,
                    indexSet
                ),
                ERC20_DATA
            );
    }

    // @notice Helper function used to know the redeemable outcomes associated to a conditionId.
    function getWinningOutcomes(
        bytes32 conditionId
    ) external view returns (bool[] memory) {
        bool[] memory result = new bool[](
            conditionalTokens.getOutcomeSlotCount(conditionId)
        );

        for (uint256 i = 0; i < result.length; i++) {
            result[i] = conditionalTokens.payoutNumerators(conditionId, i) == 0
                ? false
                : true;
        }

        return result;
    }

    // @notice Helper function used to know if the user can redeem the tokens.
    function isPayoutReported(
        bytes32 conditionId
    ) external view returns (bool) {
        return conditionalTokens.payoutDenominator(conditionId) > 0;
    }
}
