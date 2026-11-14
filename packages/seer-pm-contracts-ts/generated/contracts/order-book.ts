import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LimitOrderHook
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const limitOrderHookAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_poolManager',
        internalType: 'contract IPoolManager',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'CrossedRange' },
  { type: 'error', inputs: [], name: 'Filled' },
  { type: 'error', inputs: [], name: 'HookNotImplemented' },
  { type: 'error', inputs: [], name: 'InRange' },
  { type: 'error', inputs: [], name: 'InvalidPool' },
  { type: 'error', inputs: [], name: 'NotFilled' },
  { type: 'error', inputs: [], name: 'NotPoolManager' },
  { type: 'error', inputs: [], name: 'NotSelf' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'ZeroLiquidity' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
        indexed: true,
      },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'tickLower',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
      {
        name: 'zeroForOne',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
    ],
    name: 'Cancel',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
        indexed: true,
      },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'tickLower',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
      {
        name: 'zeroForOne',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'Fill',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
        indexed: true,
      },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
        indexed: false,
      },
      {
        name: 'tickLower',
        internalType: 'int24',
        type: 'int24',
        indexed: false,
      },
      {
        name: 'zeroForOne',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
    ],
    name: 'Place',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
        indexed: true,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
    ],
    name: 'Withdraw',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'delta0', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'delta1', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterAddLiquidity',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BalanceDelta', type: 'int256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterDonate',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
      { name: 'tick', internalType: 'int24', type: 'int24' },
    ],
    name: 'afterInitialize',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'delta0', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'delta1', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterRemoveLiquidity',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BalanceDelta', type: 'int256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct SwapParams',
        type: 'tuple',
        components: [
          { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
          { name: 'amountSpecified', internalType: 'int256', type: 'int256' },
          {
            name: 'sqrtPriceLimitX96',
            internalType: 'uint160',
            type: 'uint160',
          },
        ],
      },
      { name: 'delta', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterSwap',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'int128', type: 'int128' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeAddLiquidity',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeDonate',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'beforeInitialize',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeRemoveLiquidity',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct SwapParams',
        type: 'tuple',
        components: [
          { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
          { name: 'amountSpecified', internalType: 'int256', type: 'int256' },
          {
            name: 'sqrtPriceLimitX96',
            internalType: 'uint160',
            type: 'uint160',
          },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeSwap',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BeforeSwapDelta', type: 'int256' },
      { name: '', internalType: 'uint24', type: 'uint24' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'tickLower', internalType: 'int24', type: 'int24' },
      { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
      { name: 'to', internalType: 'address', type: 'address' },
    ],
    name: 'cancelOrder',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getHookPermissions',
    outputs: [
      {
        name: 'permissions',
        internalType: 'struct Hooks.Permissions',
        type: 'tuple',
        components: [
          { name: 'beforeInitialize', internalType: 'bool', type: 'bool' },
          { name: 'afterInitialize', internalType: 'bool', type: 'bool' },
          { name: 'beforeAddLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'afterAddLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'beforeRemoveLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'afterRemoveLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'beforeSwap', internalType: 'bool', type: 'bool' },
          { name: 'afterSwap', internalType: 'bool', type: 'bool' },
          { name: 'beforeDonate', internalType: 'bool', type: 'bool' },
          { name: 'afterDonate', internalType: 'bool', type: 'bool' },
          { name: 'beforeSwapReturnDelta', internalType: 'bool', type: 'bool' },
          { name: 'afterSwapReturnDelta', internalType: 'bool', type: 'bool' },
          {
            name: 'afterAddLiquidityReturnDelta',
            internalType: 'bool',
            type: 'bool',
          },
          {
            name: 'afterRemoveLiquidityReturnDelta',
            internalType: 'bool',
            type: 'bool',
          },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'tickLower', internalType: 'int24', type: 'int24' },
      { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
    ],
    name: 'getOrderId',
    outputs: [
      { name: '', internalType: 'OrderIdLibrary.OrderId', type: 'uint232' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
      },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'getOrderLiquidity',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'poolId', internalType: 'PoolId', type: 'bytes32' }],
    name: 'getTickLowerLast',
    outputs: [{ name: '', internalType: 'int24', type: 'int24' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
      },
    ],
    name: 'orderInfos',
    outputs: [
      { name: 'filled', internalType: 'bool', type: 'bool' },
      { name: 'currency0', internalType: 'Currency', type: 'address' },
      { name: 'currency1', internalType: 'Currency', type: 'address' },
      { name: 'currency0Total', internalType: 'uint256', type: 'uint256' },
      { name: 'currency1Total', internalType: 'uint256', type: 'uint256' },
      { name: 'liquidityTotal', internalType: 'uint128', type: 'uint128' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'tick', internalType: 'int24', type: 'int24' },
      { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
    ],
    name: 'placeOrder',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'poolManager',
    outputs: [
      { name: '', internalType: 'contract IPoolManager', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'rawData', internalType: 'bytes', type: 'bytes' }],
    name: 'unlockCallback',
    outputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'orderId',
        internalType: 'OrderIdLibrary.OrderId',
        type: 'uint232',
      },
      { name: 'to', internalType: 'address', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const limitOrderHookAddress = {
  1: '0xE10A429d18E90fbD44be3678d2AE1ef3c1691040',
  10: '0x1f78E79C20d1E77526aC21E3651FABFc22035040',
  8453: '0x19E8B37E9f4d69927Da1e13e989a2f955ee39040',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const limitOrderHookConfig = {
  address: limitOrderHookAddress,
  abi: limitOrderHookAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHook = /*#__PURE__*/ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getHookPermissions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookGetHookPermissions =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getHookPermissions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getOrderId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookGetOrderId =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getOrderId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getOrderLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookGetOrderLiquidity =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getOrderLiquidity',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getTickLowerLast"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookGetTickLowerLast =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getTickLowerLast',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"orderInfos"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookOrderInfos =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'orderInfos',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"poolManager"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useReadLimitOrderHookPoolManager =
  /*#__PURE__*/ createUseReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'poolManager',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHook = /*#__PURE__*/ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookAfterAddLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookAfterDonate =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterDonate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookAfterInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookAfterRemoveLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookAfterSwap =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterSwap',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookBeforeAddLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookBeforeDonate =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookBeforeInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookBeforeSwap =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeSwap',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"cancelOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookCancelOrder =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'cancelOrder',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"placeOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookPlaceOrder =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'placeOrder',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"unlockCallback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookUnlockCallback =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'unlockCallback',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWriteLimitOrderHookWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHook =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookAfterAddLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookAfterDonate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterDonate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookAfterInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookAfterRemoveLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookAfterSwap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterSwap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookBeforeAddLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookBeforeDonate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookBeforeInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookBeforeSwap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeSwap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"cancelOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookCancelOrder =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'cancelOrder',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"placeOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookPlaceOrder =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'placeOrder',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"unlockCallback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookUnlockCallback =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'unlockCallback',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useSimulateLimitOrderHookWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWatchLimitOrderHookEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Cancel"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWatchLimitOrderHookCancelEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Cancel',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Fill"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWatchLimitOrderHookFillEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Fill',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Place"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWatchLimitOrderHookPlaceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Place',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const useWatchLimitOrderHookWithdrawEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Withdraw',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHook = /*#__PURE__*/ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getHookPermissions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookGetHookPermissions =
  /*#__PURE__*/ createReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getHookPermissions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getOrderId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookGetOrderId = /*#__PURE__*/ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'getOrderId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getOrderLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookGetOrderLiquidity =
  /*#__PURE__*/ createReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getOrderLiquidity',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"getTickLowerLast"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookGetTickLowerLast =
  /*#__PURE__*/ createReadContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'getTickLowerLast',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"orderInfos"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookOrderInfos = /*#__PURE__*/ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'orderInfos',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"poolManager"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const readLimitOrderHookPoolManager = /*#__PURE__*/ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'poolManager',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHook = /*#__PURE__*/ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookAfterAddLiquidity =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookAfterDonate = /*#__PURE__*/ createWriteContract(
  {
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterDonate',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookAfterInitialize =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookAfterRemoveLiquidity =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookAfterSwap = /*#__PURE__*/ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'afterSwap',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookBeforeAddLiquidity =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookBeforeDonate =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookBeforeInitialize =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookBeforeSwap = /*#__PURE__*/ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'beforeSwap',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"cancelOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookCancelOrder = /*#__PURE__*/ createWriteContract(
  {
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'cancelOrder',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"placeOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookPlaceOrder = /*#__PURE__*/ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'placeOrder',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"unlockCallback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookUnlockCallback =
  /*#__PURE__*/ createWriteContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'unlockCallback',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const writeLimitOrderHookWithdraw = /*#__PURE__*/ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHook = /*#__PURE__*/ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookAfterAddLiquidity =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookAfterDonate =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterDonate',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookAfterInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookAfterRemoveLiquidity =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"afterSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookAfterSwap =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'afterSwap',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookBeforeAddLiquidity =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeDonate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookBeforeDonate =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeInitialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookBeforeInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"beforeSwap"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookBeforeSwap =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'beforeSwap',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"cancelOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookCancelOrder =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'cancelOrder',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"placeOrder"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookPlaceOrder =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'placeOrder',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"unlockCallback"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookUnlockCallback =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'unlockCallback',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link limitOrderHookAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const simulateLimitOrderHookWithdraw =
  /*#__PURE__*/ createSimulateContract({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const watchLimitOrderHookEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Cancel"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const watchLimitOrderHookCancelEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Cancel',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Fill"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const watchLimitOrderHookFillEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Fill',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Place"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const watchLimitOrderHookPlaceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Place',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link limitOrderHookAbi}__ and `eventName` set to `"Withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xE10A429d18E90fbD44be3678d2AE1ef3c1691040)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1f78E79C20d1E77526aC21E3651FABFc22035040)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x19E8B37E9f4d69927Da1e13e989a2f955ee39040)
 */
export const watchLimitOrderHookWithdrawEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    eventName: 'Withdraw',
  })
