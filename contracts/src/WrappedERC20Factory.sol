// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Market.sol";
import "./RealityProxy.sol";

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

    function createWrappedToken(
        address multiToken,
        uint256 tokenId,
        string memory tokenName,
        string memory tokenSymbol
    ) external returns (IERC20) {
        bytes memory tokenData = abi.encodePacked(
            bytes32(bytes(tokenName)),
            bytes32(bytes(tokenSymbol)),
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
