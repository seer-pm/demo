// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev An ERC20 that calls `target` with `data` once, during its next transfer, the way a token with transfer
/// hooks (such as ERC777) hands control to another contract in the middle of a deposit.
contract CallbackToken is ERC20 {
    address public target;
    bytes public data;

    constructor() ERC20("CallbackToken", "CB") {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setCallback(address _target, bytes calldata _data) external {
        target = _target;
        data = _data;
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        address callee = target;
        if (callee == address(0)) return;
        target = address(0);
        (bool ok, bytes memory result) = callee.call(data);
        if (!ok) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
