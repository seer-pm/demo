/**
 *  @authors: [@xyzseer]
 *  @reviewers: [@nvm1410, @madhurMongia]
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";

import {Wrapped1155Factory, IERC20} from "./Interfaces.sol";

contract WrappedERC20Factory {
    Wrapped1155Factory public immutable wrapped1155Factory; // Address of the Wrapped1155Factory implementation

    mapping(uint256 => IERC20) public tokens; // Maps the ERC1155 tokenId to the ERC20 token
    mapping(uint256 => bytes) public data; // Token data associated to each tokenId

    /**
     *  @dev Constructor.
     *  @param _wrapped1155Factory Address of the Wrapped1155Factory implementation.
     */
    constructor(Wrapped1155Factory _wrapped1155Factory) {
        wrapped1155Factory = _wrapped1155Factory;
    }

    /// @dev Encodes a short string (less than than 31 bytes long) as for storage as expected by Solidity.
    /// See https://github.com/gnosis/1155-to-20/pull/4#discussion_r573630922
    /// @param value String to encode
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

    /// @dev Wraps an ERC1155 token to ERC20, with a custom name and symbol.
    /// @param multiToken ERC1155 token to wrap
    /// @param tokenId ERC1155 token ID
    /// @param tokenName Wrapped ERC20 name
    /// @param tokenSymbol Wrapped ERC20 symbol
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
