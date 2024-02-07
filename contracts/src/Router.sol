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

    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) external {
        IERC20(collateralToken).transferFrom(msg.sender, address(this), amount);

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
            wrapped1155.approve(address(this), amount);
            wrapped1155.transferFrom(address(this), msg.sender, amount);
        }
    }

    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata partition,
        uint amount
    ) external {
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

        collateralToken.approve(address(this), amount);
        collateralToken.transferFrom(address(this), msg.sender, amount);
    }

    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint[] calldata indexSets
    ) external {
        uint256 initialBalance = collateralToken.balanceOf(address(this));

        for (uint j = 0; j < indexSets.length; j++) {
            uint256 tokenId = getTokenId(
                collateralToken,
                parentCollectionId,
                conditionId,
                indexSets[j]
            );

            uint256 amount = collateralToken.balanceOf(msg.sender);

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

        conditionalTokens.redeemPositions(
            address(collateralToken),
            parentCollectionId,
            conditionId,
            indexSets
        );

        // transfer collateral to the user
        uint256 finalBalance = collateralToken.balanceOf(address(this));

        if (finalBalance > initialBalance) {
            collateralToken.transferFrom(
                address(this),
                msg.sender,
                finalBalance - initialBalance
            );
        }
    }

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
}
