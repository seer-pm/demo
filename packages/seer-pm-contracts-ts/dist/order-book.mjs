// generated/contracts/order-book.ts
import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent
} from "wagmi/codegen";
import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent
} from "wagmi/codegen";
var limitOrderHookAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_poolManager",
        internalType: "contract IPoolManager",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  { type: "error", inputs: [], name: "CrossedRange" },
  { type: "error", inputs: [], name: "Filled" },
  { type: "error", inputs: [], name: "HookNotImplemented" },
  { type: "error", inputs: [], name: "InRange" },
  { type: "error", inputs: [], name: "NotFilled" },
  { type: "error", inputs: [], name: "NotPoolManager" },
  {
    type: "error",
    inputs: [{ name: "token", internalType: "address", type: "address" }],
    name: "SafeERC20FailedOperation"
  },
  { type: "error", inputs: [], name: "ZeroLiquidity" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232",
        indexed: true
      },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ],
        indexed: false
      },
      {
        name: "tickLower",
        internalType: "int24",
        type: "int24",
        indexed: false
      },
      {
        name: "zeroForOne",
        internalType: "bool",
        type: "bool",
        indexed: false
      },
      {
        name: "liquidity",
        internalType: "uint128",
        type: "uint128",
        indexed: false
      }
    ],
    name: "Cancel"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232",
        indexed: true
      },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ],
        indexed: false
      },
      {
        name: "tickLower",
        internalType: "int24",
        type: "int24",
        indexed: false
      },
      {
        name: "zeroForOne",
        internalType: "bool",
        type: "bool",
        indexed: false
      }
    ],
    name: "Fill"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232",
        indexed: true
      },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ],
        indexed: false
      },
      {
        name: "tickLower",
        internalType: "int24",
        type: "int24",
        indexed: false
      },
      {
        name: "zeroForOne",
        internalType: "bool",
        type: "bool",
        indexed: false
      },
      {
        name: "liquidity",
        internalType: "uint128",
        type: "uint128",
        indexed: false
      }
    ],
    name: "Place"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232",
        indexed: true
      },
      {
        name: "liquidity",
        internalType: "uint128",
        type: "uint128",
        indexed: false
      }
    ],
    name: "Withdraw"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct ModifyLiquidityParams",
        type: "tuple",
        components: [
          { name: "tickLower", internalType: "int24", type: "int24" },
          { name: "tickUpper", internalType: "int24", type: "int24" },
          { name: "liquidityDelta", internalType: "int256", type: "int256" },
          { name: "salt", internalType: "bytes32", type: "bytes32" }
        ]
      },
      { name: "delta0", internalType: "BalanceDelta", type: "int256" },
      { name: "delta1", internalType: "BalanceDelta", type: "int256" },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "afterAddLiquidity",
    outputs: [
      { name: "", internalType: "bytes4", type: "bytes4" },
      { name: "", internalType: "BalanceDelta", type: "int256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "amount0", internalType: "uint256", type: "uint256" },
      { name: "amount1", internalType: "uint256", type: "uint256" },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "afterDonate",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "sqrtPriceX96", internalType: "uint160", type: "uint160" },
      { name: "tick", internalType: "int24", type: "int24" }
    ],
    name: "afterInitialize",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct ModifyLiquidityParams",
        type: "tuple",
        components: [
          { name: "tickLower", internalType: "int24", type: "int24" },
          { name: "tickUpper", internalType: "int24", type: "int24" },
          { name: "liquidityDelta", internalType: "int256", type: "int256" },
          { name: "salt", internalType: "bytes32", type: "bytes32" }
        ]
      },
      { name: "delta0", internalType: "BalanceDelta", type: "int256" },
      { name: "delta1", internalType: "BalanceDelta", type: "int256" },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "afterRemoveLiquidity",
    outputs: [
      { name: "", internalType: "bytes4", type: "bytes4" },
      { name: "", internalType: "BalanceDelta", type: "int256" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct SwapParams",
        type: "tuple",
        components: [
          { name: "zeroForOne", internalType: "bool", type: "bool" },
          { name: "amountSpecified", internalType: "int256", type: "int256" },
          {
            name: "sqrtPriceLimitX96",
            internalType: "uint160",
            type: "uint160"
          }
        ]
      },
      { name: "delta", internalType: "BalanceDelta", type: "int256" },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "afterSwap",
    outputs: [
      { name: "", internalType: "bytes4", type: "bytes4" },
      { name: "", internalType: "int128", type: "int128" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct ModifyLiquidityParams",
        type: "tuple",
        components: [
          { name: "tickLower", internalType: "int24", type: "int24" },
          { name: "tickUpper", internalType: "int24", type: "int24" },
          { name: "liquidityDelta", internalType: "int256", type: "int256" },
          { name: "salt", internalType: "bytes32", type: "bytes32" }
        ]
      },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "beforeAddLiquidity",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "amount0", internalType: "uint256", type: "uint256" },
      { name: "amount1", internalType: "uint256", type: "uint256" },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "beforeDonate",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "sqrtPriceX96", internalType: "uint160", type: "uint160" }
    ],
    name: "beforeInitialize",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct ModifyLiquidityParams",
        type: "tuple",
        components: [
          { name: "tickLower", internalType: "int24", type: "int24" },
          { name: "tickUpper", internalType: "int24", type: "int24" },
          { name: "liquidityDelta", internalType: "int256", type: "int256" },
          { name: "salt", internalType: "bytes32", type: "bytes32" }
        ]
      },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "beforeRemoveLiquidity",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      {
        name: "params",
        internalType: "struct SwapParams",
        type: "tuple",
        components: [
          { name: "zeroForOne", internalType: "bool", type: "bool" },
          { name: "amountSpecified", internalType: "int256", type: "int256" },
          {
            name: "sqrtPriceLimitX96",
            internalType: "uint160",
            type: "uint160"
          }
        ]
      },
      { name: "hookData", internalType: "bytes", type: "bytes" }
    ],
    name: "beforeSwap",
    outputs: [
      { name: "", internalType: "bytes4", type: "bytes4" },
      { name: "", internalType: "BeforeSwapDelta", type: "int256" },
      { name: "", internalType: "uint24", type: "uint24" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "tickLower", internalType: "int24", type: "int24" },
      { name: "zeroForOne", internalType: "bool", type: "bool" },
      { name: "to", internalType: "address", type: "address" }
    ],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "getHookPermissions",
    outputs: [
      {
        name: "permissions",
        internalType: "struct Hooks.Permissions",
        type: "tuple",
        components: [
          { name: "beforeInitialize", internalType: "bool", type: "bool" },
          { name: "afterInitialize", internalType: "bool", type: "bool" },
          { name: "beforeAddLiquidity", internalType: "bool", type: "bool" },
          { name: "afterAddLiquidity", internalType: "bool", type: "bool" },
          { name: "beforeRemoveLiquidity", internalType: "bool", type: "bool" },
          { name: "afterRemoveLiquidity", internalType: "bool", type: "bool" },
          { name: "beforeSwap", internalType: "bool", type: "bool" },
          { name: "afterSwap", internalType: "bool", type: "bool" },
          { name: "beforeDonate", internalType: "bool", type: "bool" },
          { name: "afterDonate", internalType: "bool", type: "bool" },
          { name: "beforeSwapReturnDelta", internalType: "bool", type: "bool" },
          { name: "afterSwapReturnDelta", internalType: "bool", type: "bool" },
          {
            name: "afterAddLiquidityReturnDelta",
            internalType: "bool",
            type: "bool"
          },
          {
            name: "afterRemoveLiquidityReturnDelta",
            internalType: "bool",
            type: "bool"
          }
        ]
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "tickLower", internalType: "int24", type: "int24" },
      { name: "zeroForOne", internalType: "bool", type: "bool" }
    ],
    name: "getOrderId",
    outputs: [
      { name: "", internalType: "OrderIdLibrary.OrderId", type: "uint232" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232"
      }
    ],
    name: "getOrderInfo",
    outputs: [
      { name: "filled", internalType: "bool", type: "bool" },
      { name: "currency0", internalType: "Currency", type: "address" },
      { name: "currency1", internalType: "Currency", type: "address" },
      { name: "currency0Total", internalType: "uint256", type: "uint256" },
      { name: "currency1Total", internalType: "uint256", type: "uint256" },
      { name: "liquidityTotal", internalType: "uint128", type: "uint128" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232"
      },
      { name: "owner", internalType: "address", type: "address" }
    ],
    name: "getOrderLiquidity",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "poolId", internalType: "PoolId", type: "bytes32" }],
    name: "getTickLowerLast",
    outputs: [{ name: "", internalType: "int24", type: "int24" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      },
      { name: "tick", internalType: "int24", type: "int24" },
      { name: "zeroForOne", internalType: "bool", type: "bool" },
      { name: "liquidity", internalType: "uint128", type: "uint128" }
    ],
    name: "placeOrder",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "poolManager",
    outputs: [
      { name: "", internalType: "contract IPoolManager", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "rawData", internalType: "bytes", type: "bytes" }],
    name: "unlockCallback",
    outputs: [{ name: "returnData", internalType: "bytes", type: "bytes" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "orderId",
        internalType: "OrderIdLibrary.OrderId",
        type: "uint232"
      },
      { name: "to", internalType: "address", type: "address" }
    ],
    name: "withdraw",
    outputs: [
      { name: "amount0", internalType: "uint256", type: "uint256" },
      { name: "amount1", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "nonpayable"
  }
];
var limitOrderHookAddress = {
  8453: "0x8D34ff3de81395859E14267f2678a3044344D040"
};
var limitOrderHookConfig = {
  address: limitOrderHookAddress,
  abi: limitOrderHookAbi
};
var seerUniV4PoolInitializerAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_poolManager", internalType: "address", type: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "POOL_MANAGER",
    outputs: [
      { name: "", internalType: "contract IPoolManager", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "tokenA", internalType: "address", type: "address" },
      { name: "tokenB", internalType: "address", type: "address" },
      { name: "hooks", internalType: "address", type: "address" },
      { name: "poolFee", internalType: "uint24", type: "uint24" },
      { name: "tickSpacing", internalType: "int24", type: "int24" }
    ],
    name: "getPoolKey",
    outputs: [
      {
        name: "",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" }
        ]
      }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      { name: "tokenA", internalType: "address", type: "address" },
      { name: "tokenB", internalType: "address", type: "address" },
      { name: "hooks", internalType: "address", type: "address" },
      { name: "poolFee", internalType: "uint24", type: "uint24" },
      { name: "tickSpacing", internalType: "int24", type: "int24" },
      { name: "sqrtPriceX96", internalType: "uint160", type: "uint160" }
    ],
    name: "initializePool",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "address", type: "address" },
      { name: "collateralToken", internalType: "address", type: "address" },
      { name: "hooks", internalType: "address", type: "address" },
      { name: "poolFee", internalType: "uint24", type: "uint24" },
      { name: "tickSpacing", internalType: "int24", type: "int24" },
      { name: "initialPrices", internalType: "uint160[]", type: "uint160[]" }
    ],
    name: "initializePools",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "tokenA", internalType: "address", type: "address" },
      { name: "tokenB", internalType: "address", type: "address" },
      { name: "hooks", internalType: "address", type: "address" },
      { name: "poolFee", internalType: "uint24", type: "uint24" },
      { name: "tickSpacing", internalType: "int24", type: "int24" }
    ],
    name: "isPoolInitialized",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  }
];
var seerUniV4PoolInitializerAddress = {
  8453: "0xae300296486a63621f7f31E1B94aD22d32347deA"
};
var seerUniV4PoolInitializerConfig = {
  address: seerUniV4PoolInitializerAddress,
  abi: seerUniV4PoolInitializerAbi
};
var useReadLimitOrderHook = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var useReadLimitOrderHookGetHookPermissions = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getHookPermissions"
});
var useReadLimitOrderHookGetOrderId = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderId"
});
var useReadLimitOrderHookGetOrderInfo = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderInfo"
});
var useReadLimitOrderHookGetOrderLiquidity = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderLiquidity"
});
var useReadLimitOrderHookGetTickLowerLast = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getTickLowerLast"
});
var useReadLimitOrderHookPoolManager = /* @__PURE__ */ createUseReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "poolManager"
});
var useWriteLimitOrderHook = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var useWriteLimitOrderHookAfterAddLiquidity = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterAddLiquidity"
});
var useWriteLimitOrderHookAfterDonate = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterDonate"
});
var useWriteLimitOrderHookAfterInitialize = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterInitialize"
});
var useWriteLimitOrderHookAfterRemoveLiquidity = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterRemoveLiquidity"
});
var useWriteLimitOrderHookAfterSwap = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterSwap"
});
var useWriteLimitOrderHookBeforeAddLiquidity = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeAddLiquidity"
});
var useWriteLimitOrderHookBeforeDonate = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeDonate"
});
var useWriteLimitOrderHookBeforeInitialize = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeInitialize"
});
var useWriteLimitOrderHookBeforeRemoveLiquidity = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeRemoveLiquidity"
});
var useWriteLimitOrderHookBeforeSwap = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeSwap"
});
var useWriteLimitOrderHookCancelOrder = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "cancelOrder"
});
var useWriteLimitOrderHookPlaceOrder = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "placeOrder"
});
var useWriteLimitOrderHookUnlockCallback = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "unlockCallback"
});
var useWriteLimitOrderHookWithdraw = /* @__PURE__ */ createUseWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "withdraw"
});
var useSimulateLimitOrderHook = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var useSimulateLimitOrderHookAfterAddLiquidity = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterAddLiquidity"
});
var useSimulateLimitOrderHookAfterDonate = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterDonate"
});
var useSimulateLimitOrderHookAfterInitialize = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterInitialize"
});
var useSimulateLimitOrderHookAfterRemoveLiquidity = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterRemoveLiquidity"
});
var useSimulateLimitOrderHookAfterSwap = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterSwap"
});
var useSimulateLimitOrderHookBeforeAddLiquidity = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeAddLiquidity"
});
var useSimulateLimitOrderHookBeforeDonate = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeDonate"
});
var useSimulateLimitOrderHookBeforeInitialize = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeInitialize"
});
var useSimulateLimitOrderHookBeforeRemoveLiquidity = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeRemoveLiquidity"
});
var useSimulateLimitOrderHookBeforeSwap = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeSwap"
});
var useSimulateLimitOrderHookCancelOrder = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "cancelOrder"
});
var useSimulateLimitOrderHookPlaceOrder = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "placeOrder"
});
var useSimulateLimitOrderHookUnlockCallback = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "unlockCallback"
});
var useSimulateLimitOrderHookWithdraw = /* @__PURE__ */ createUseSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "withdraw"
});
var useWatchLimitOrderHookEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var useWatchLimitOrderHookCancelEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Cancel"
});
var useWatchLimitOrderHookFillEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Fill"
});
var useWatchLimitOrderHookPlaceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Place"
});
var useWatchLimitOrderHookWithdrawEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Withdraw"
});
var useReadSeerUniV4PoolInitializer = /* @__PURE__ */ createUseReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var useReadSeerUniV4PoolInitializerPoolManager = /* @__PURE__ */ createUseReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "POOL_MANAGER"
});
var useReadSeerUniV4PoolInitializerGetPoolKey = /* @__PURE__ */ createUseReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "getPoolKey"
});
var useReadSeerUniV4PoolInitializerIsPoolInitialized = /* @__PURE__ */ createUseReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "isPoolInitialized"
});
var useWriteSeerUniV4PoolInitializer = /* @__PURE__ */ createUseWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var useWriteSeerUniV4PoolInitializerInitializePool = /* @__PURE__ */ createUseWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePool"
});
var useWriteSeerUniV4PoolInitializerInitializePools = /* @__PURE__ */ createUseWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePools"
});
var useSimulateSeerUniV4PoolInitializer = /* @__PURE__ */ createUseSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var useSimulateSeerUniV4PoolInitializerInitializePool = /* @__PURE__ */ createUseSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePool"
});
var useSimulateSeerUniV4PoolInitializerInitializePools = /* @__PURE__ */ createUseSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePools"
});
var readLimitOrderHook = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var readLimitOrderHookGetHookPermissions = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getHookPermissions"
});
var readLimitOrderHookGetOrderId = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderId"
});
var readLimitOrderHookGetOrderInfo = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderInfo"
});
var readLimitOrderHookGetOrderLiquidity = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getOrderLiquidity"
});
var readLimitOrderHookGetTickLowerLast = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "getTickLowerLast"
});
var readLimitOrderHookPoolManager = /* @__PURE__ */ createReadContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "poolManager"
});
var writeLimitOrderHook = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var writeLimitOrderHookAfterAddLiquidity = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterAddLiquidity"
});
var writeLimitOrderHookAfterDonate = /* @__PURE__ */ createWriteContract(
  {
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: "afterDonate"
  }
);
var writeLimitOrderHookAfterInitialize = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterInitialize"
});
var writeLimitOrderHookAfterRemoveLiquidity = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterRemoveLiquidity"
});
var writeLimitOrderHookAfterSwap = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterSwap"
});
var writeLimitOrderHookBeforeAddLiquidity = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeAddLiquidity"
});
var writeLimitOrderHookBeforeDonate = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeDonate"
});
var writeLimitOrderHookBeforeInitialize = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeInitialize"
});
var writeLimitOrderHookBeforeRemoveLiquidity = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeRemoveLiquidity"
});
var writeLimitOrderHookBeforeSwap = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeSwap"
});
var writeLimitOrderHookCancelOrder = /* @__PURE__ */ createWriteContract(
  {
    abi: limitOrderHookAbi,
    address: limitOrderHookAddress,
    functionName: "cancelOrder"
  }
);
var writeLimitOrderHookPlaceOrder = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "placeOrder"
});
var writeLimitOrderHookUnlockCallback = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "unlockCallback"
});
var writeLimitOrderHookWithdraw = /* @__PURE__ */ createWriteContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "withdraw"
});
var simulateLimitOrderHook = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var simulateLimitOrderHookAfterAddLiquidity = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterAddLiquidity"
});
var simulateLimitOrderHookAfterDonate = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterDonate"
});
var simulateLimitOrderHookAfterInitialize = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterInitialize"
});
var simulateLimitOrderHookAfterRemoveLiquidity = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterRemoveLiquidity"
});
var simulateLimitOrderHookAfterSwap = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "afterSwap"
});
var simulateLimitOrderHookBeforeAddLiquidity = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeAddLiquidity"
});
var simulateLimitOrderHookBeforeDonate = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeDonate"
});
var simulateLimitOrderHookBeforeInitialize = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeInitialize"
});
var simulateLimitOrderHookBeforeRemoveLiquidity = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeRemoveLiquidity"
});
var simulateLimitOrderHookBeforeSwap = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "beforeSwap"
});
var simulateLimitOrderHookCancelOrder = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "cancelOrder"
});
var simulateLimitOrderHookPlaceOrder = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "placeOrder"
});
var simulateLimitOrderHookUnlockCallback = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "unlockCallback"
});
var simulateLimitOrderHookWithdraw = /* @__PURE__ */ createSimulateContract({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  functionName: "withdraw"
});
var watchLimitOrderHookEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress
});
var watchLimitOrderHookCancelEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Cancel"
});
var watchLimitOrderHookFillEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Fill"
});
var watchLimitOrderHookPlaceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Place"
});
var watchLimitOrderHookWithdrawEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: limitOrderHookAbi,
  address: limitOrderHookAddress,
  eventName: "Withdraw"
});
var readSeerUniV4PoolInitializer = /* @__PURE__ */ createReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var readSeerUniV4PoolInitializerPoolManager = /* @__PURE__ */ createReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "POOL_MANAGER"
});
var readSeerUniV4PoolInitializerGetPoolKey = /* @__PURE__ */ createReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "getPoolKey"
});
var readSeerUniV4PoolInitializerIsPoolInitialized = /* @__PURE__ */ createReadContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "isPoolInitialized"
});
var writeSeerUniV4PoolInitializer = /* @__PURE__ */ createWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var writeSeerUniV4PoolInitializerInitializePool = /* @__PURE__ */ createWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePool"
});
var writeSeerUniV4PoolInitializerInitializePools = /* @__PURE__ */ createWriteContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePools"
});
var simulateSeerUniV4PoolInitializer = /* @__PURE__ */ createSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress
});
var simulateSeerUniV4PoolInitializerInitializePool = /* @__PURE__ */ createSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePool"
});
var simulateSeerUniV4PoolInitializerInitializePools = /* @__PURE__ */ createSimulateContract({
  abi: seerUniV4PoolInitializerAbi,
  address: seerUniV4PoolInitializerAddress,
  functionName: "initializePools"
});
export {
  limitOrderHookAbi,
  limitOrderHookAddress,
  limitOrderHookConfig,
  readLimitOrderHook,
  readLimitOrderHookGetHookPermissions,
  readLimitOrderHookGetOrderId,
  readLimitOrderHookGetOrderInfo,
  readLimitOrderHookGetOrderLiquidity,
  readLimitOrderHookGetTickLowerLast,
  readLimitOrderHookPoolManager,
  readSeerUniV4PoolInitializer,
  readSeerUniV4PoolInitializerGetPoolKey,
  readSeerUniV4PoolInitializerIsPoolInitialized,
  readSeerUniV4PoolInitializerPoolManager,
  seerUniV4PoolInitializerAbi,
  seerUniV4PoolInitializerAddress,
  seerUniV4PoolInitializerConfig,
  simulateLimitOrderHook,
  simulateLimitOrderHookAfterAddLiquidity,
  simulateLimitOrderHookAfterDonate,
  simulateLimitOrderHookAfterInitialize,
  simulateLimitOrderHookAfterRemoveLiquidity,
  simulateLimitOrderHookAfterSwap,
  simulateLimitOrderHookBeforeAddLiquidity,
  simulateLimitOrderHookBeforeDonate,
  simulateLimitOrderHookBeforeInitialize,
  simulateLimitOrderHookBeforeRemoveLiquidity,
  simulateLimitOrderHookBeforeSwap,
  simulateLimitOrderHookCancelOrder,
  simulateLimitOrderHookPlaceOrder,
  simulateLimitOrderHookUnlockCallback,
  simulateLimitOrderHookWithdraw,
  simulateSeerUniV4PoolInitializer,
  simulateSeerUniV4PoolInitializerInitializePool,
  simulateSeerUniV4PoolInitializerInitializePools,
  useReadLimitOrderHook,
  useReadLimitOrderHookGetHookPermissions,
  useReadLimitOrderHookGetOrderId,
  useReadLimitOrderHookGetOrderInfo,
  useReadLimitOrderHookGetOrderLiquidity,
  useReadLimitOrderHookGetTickLowerLast,
  useReadLimitOrderHookPoolManager,
  useReadSeerUniV4PoolInitializer,
  useReadSeerUniV4PoolInitializerGetPoolKey,
  useReadSeerUniV4PoolInitializerIsPoolInitialized,
  useReadSeerUniV4PoolInitializerPoolManager,
  useSimulateLimitOrderHook,
  useSimulateLimitOrderHookAfterAddLiquidity,
  useSimulateLimitOrderHookAfterDonate,
  useSimulateLimitOrderHookAfterInitialize,
  useSimulateLimitOrderHookAfterRemoveLiquidity,
  useSimulateLimitOrderHookAfterSwap,
  useSimulateLimitOrderHookBeforeAddLiquidity,
  useSimulateLimitOrderHookBeforeDonate,
  useSimulateLimitOrderHookBeforeInitialize,
  useSimulateLimitOrderHookBeforeRemoveLiquidity,
  useSimulateLimitOrderHookBeforeSwap,
  useSimulateLimitOrderHookCancelOrder,
  useSimulateLimitOrderHookPlaceOrder,
  useSimulateLimitOrderHookUnlockCallback,
  useSimulateLimitOrderHookWithdraw,
  useSimulateSeerUniV4PoolInitializer,
  useSimulateSeerUniV4PoolInitializerInitializePool,
  useSimulateSeerUniV4PoolInitializerInitializePools,
  useWatchLimitOrderHookCancelEvent,
  useWatchLimitOrderHookEvent,
  useWatchLimitOrderHookFillEvent,
  useWatchLimitOrderHookPlaceEvent,
  useWatchLimitOrderHookWithdrawEvent,
  useWriteLimitOrderHook,
  useWriteLimitOrderHookAfterAddLiquidity,
  useWriteLimitOrderHookAfterDonate,
  useWriteLimitOrderHookAfterInitialize,
  useWriteLimitOrderHookAfterRemoveLiquidity,
  useWriteLimitOrderHookAfterSwap,
  useWriteLimitOrderHookBeforeAddLiquidity,
  useWriteLimitOrderHookBeforeDonate,
  useWriteLimitOrderHookBeforeInitialize,
  useWriteLimitOrderHookBeforeRemoveLiquidity,
  useWriteLimitOrderHookBeforeSwap,
  useWriteLimitOrderHookCancelOrder,
  useWriteLimitOrderHookPlaceOrder,
  useWriteLimitOrderHookUnlockCallback,
  useWriteLimitOrderHookWithdraw,
  useWriteSeerUniV4PoolInitializer,
  useWriteSeerUniV4PoolInitializerInitializePool,
  useWriteSeerUniV4PoolInitializerInitializePools,
  watchLimitOrderHookCancelEvent,
  watchLimitOrderHookEvent,
  watchLimitOrderHookFillEvent,
  watchLimitOrderHookPlaceEvent,
  watchLimitOrderHookWithdrawEvent,
  writeLimitOrderHook,
  writeLimitOrderHookAfterAddLiquidity,
  writeLimitOrderHookAfterDonate,
  writeLimitOrderHookAfterInitialize,
  writeLimitOrderHookAfterRemoveLiquidity,
  writeLimitOrderHookAfterSwap,
  writeLimitOrderHookBeforeAddLiquidity,
  writeLimitOrderHookBeforeDonate,
  writeLimitOrderHookBeforeInitialize,
  writeLimitOrderHookBeforeRemoveLiquidity,
  writeLimitOrderHookBeforeSwap,
  writeLimitOrderHookCancelOrder,
  writeLimitOrderHookPlaceOrder,
  writeLimitOrderHookUnlockCallback,
  writeLimitOrderHookWithdraw,
  writeSeerUniV4PoolInitializer,
  writeSeerUniV4PoolInitializerInitializePool,
  writeSeerUniV4PoolInitializerInitializePools
};
