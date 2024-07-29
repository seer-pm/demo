/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";

import {Wrapped1155Factory, IERC20} from "./Interfaces.sol";

contract WrappedERC20Factory {
    Wrapped1155Factory public immutable wrapped1155Factory;

    mapping(uint256 => IERC20) public tokens;
    mapping(uint256 => bytes) public data;

    /**
     *  @dev Constructor.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     */
    constructor(Wrapped1155Factory _wrapped1155Factory) {
        wrapped1155Factory = _wrapped1155Factory;
    }

    // @dev see https://github.com/gnosis/1155-to-20/pull/4#discussion_r573630922
    function toString31(
        string memory value
    ) public pure returns (bytes32 encodedString) {
        uint256 length = bytes(value).length;
        require(length < 32, "string too long");

        // Read the right-padded string data, which is guaranteed to fit into a single
        // word because its length is less than 32.
        assembly {
            encodedString := mload(add(value, 0x20))
        }

        // Now mask the string data, this ensures that the bytes past the string length
        // are all 0s.
        bytes32 mask = bytes32(type(uint256).max << ((32 - length) << 3));
        encodedString = encodedString & mask;

        // Finally, set the least significant byte to be the hex length of the encoded
        // string, that is its byte-length times two.
        encodedString = encodedString | bytes32(length << 1);
    }

    function createWrappedToken(
        address multiToken,
        uint256 tokenId,
        string memory tokenName,
        string memory tokenSymbol
    ) external returns (IERC20) {
        bytes memory tokenData = abi.encodePacked(
            toString31(tokenName),
            toString31(tokenSymbol),
            uint8(18)
        );

        IERC20 erc20 = wrapped1155Factory.requireWrapped1155(
            multiToken,
            tokenId,
            tokenData
        );

        tokens[tokenId] = erc20;
        data[tokenId] = tokenData;

        return erc20;
    }
}
