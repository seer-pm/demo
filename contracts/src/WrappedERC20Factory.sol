/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia, @unknownunknown1, @mani99brar]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Wrapped1155Factory, IERC20} from "./Interfaces.sol";

contract WrappedERC20Factory {
    Wrapped1155Factory public immutable wrapped1155Factory; // Address of the Wrapped1155Factory implementation.

    mapping(uint256 => IERC20) public tokens; // Maps the ERC1155 tokenId to the ERC20 token.

    // encoded value corresponds to name=Seer Position, symbol=SER-POS, decimals=18.
    bytes public constant TOKEN_DATA = hex'5365657220506f736974696f6e0000000000000000000000000000000000001a5345522d504f530000000000000000000000000000000000000000000000000e1200000000000000000000000000000000000000000000000000000000000000';

    /**
     *  @dev Constructor.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     */
    constructor(Wrapped1155Factory _wrapped1155Factory) {
        wrapped1155Factory = _wrapped1155Factory;
    }

    /// @dev Wraps an ERC1155 token to ERC20.
    /// @param multiToken ERC1155 token to wrap.
    /// @param tokenId ERC1155 token ID.
    function createWrappedToken(
        address multiToken,
        uint256 tokenId
    ) external returns (IERC20) {
        IERC20 erc20 = wrapped1155Factory.requireWrapped1155(
            multiToken,
            tokenId,
            TOKEN_DATA
        );

        // requireWrapped1155 will return the same ERC20 if it's called multiple times with the same multiToken & tokenId.
        tokens[tokenId] = erc20;

        return erc20;
    }
}
