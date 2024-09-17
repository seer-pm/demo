// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "../../../src/interaction/conditional-tokens/ERC1155/ERC1155.sol";

contract MinimalERC1155 is ERC1155 {
    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _mint(account, id, amount, data);
    }

    function batchMint(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _batchMint(to, ids, amounts, data);
    }
}
