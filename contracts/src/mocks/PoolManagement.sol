// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;
import "@cryptoalgebra/core/contracts/interfaces/IAlgebraPool.sol";
import "@cryptoalgebra/integral-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

/// @title Provides functions for deriving a pool address from the factory, tokens, and the fee
/// @dev Credit to Uniswap Labs under GPL-2.0-or-later license:
/// https://github.com/Uniswap/v3-periphery
contract PoolManagement {
    bytes32 public constant POOL_INIT_CODE_HASH =
        0xbce37a54eab2fcd71913a0d40723e04238970e7fc1159bfd58ad5b79531697e7;

    address public constant POOL_DEPLOYER =
        0xC1b576AC6Ec749d5Ace1787bF9Ec6340908ddB47;

    /// @notice Computes the pool address given the tokens
    /// @return pool The contract address of the V3 pool
    function computeAddress(
        address tokenA,
        address tokenB
    ) public pure returns (address pool) {
        if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);
        pool = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            POOL_DEPLOYER,
                            keccak256(abi.encode(tokenA, tokenB)),
                            POOL_INIT_CODE_HASH
                        )
                    )
                )
            )
        );
    }
}
