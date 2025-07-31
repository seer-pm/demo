export const ethFlowAbi = [
  {
    inputs: [
      { internalType: "contract ICoWSwapSettlement", name: "_cowSwapSettlement", type: "address" },
      { internalType: "contract IWrappedNativeToken", name: "_wrappedNativeToken", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "EthTransferFailed", type: "error" },
  { inputs: [], name: "IncorrectEthAmount", type: "error" },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "NotAllowedToInvalidateOrder",
    type: "error",
  },
  { inputs: [], name: "NotAllowedZeroSellAmount", type: "error" },
  { inputs: [], name: "OrderIsAlreadyExpired", type: "error" },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "OrderIsAlreadyOwned",
    type: "error",
  },
  { inputs: [], name: "ReceiverMustBeSet", type: "error" },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "bytes", name: "orderUid", type: "bytes" }],
    name: "OrderInvalidation",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      {
        components: [
          { internalType: "contract IERC20", name: "sellToken", type: "address" },
          { internalType: "contract IERC20", name: "buyToken", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "bytes32", name: "kind", type: "bytes32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          { internalType: "bytes32", name: "sellTokenBalance", type: "bytes32" },
          { internalType: "bytes32", name: "buyTokenBalance", type: "bytes32" },
        ],
        indexed: false,
        internalType: "struct GPv2Order.Data",
        name: "order",
        type: "tuple",
      },
      {
        components: [
          { internalType: "enum ICoWSwapOnchainOrders.OnchainSigningScheme", name: "scheme", type: "uint8" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct ICoWSwapOnchainOrders.OnchainSignature",
        name: "signature",
        type: "tuple",
      },
      { indexed: false, internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "OrderPlacement",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "bytes", name: "orderUid", type: "bytes" },
      { indexed: true, internalType: "address", name: "refunder", type: "address" },
    ],
    name: "OrderRefund",
    type: "event",
  },
  {
    inputs: [],
    name: "cowSwapSettlement",
    outputs: [{ internalType: "contract ICoWSwapSettlement", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "contract IERC20", name: "buyToken", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          { internalType: "int64", name: "quoteId", type: "int64" },
        ],
        internalType: "struct EthFlowOrder.Data",
        name: "order",
        type: "tuple",
      },
    ],
    name: "createOrder",
    outputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "contract IERC20", name: "buyToken", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          { internalType: "int64", name: "quoteId", type: "int64" },
        ],
        internalType: "struct EthFlowOrder.Data",
        name: "order",
        type: "tuple",
      },
    ],
    name: "invalidateOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "contract IERC20", name: "buyToken", type: "address" },
          { internalType: "address", name: "receiver", type: "address" },
          { internalType: "uint256", name: "sellAmount", type: "uint256" },
          { internalType: "uint256", name: "buyAmount", type: "uint256" },
          { internalType: "bytes32", name: "appData", type: "bytes32" },
          { internalType: "uint256", name: "feeAmount", type: "uint256" },
          { internalType: "uint32", name: "validTo", type: "uint32" },
          { internalType: "bool", name: "partiallyFillable", type: "bool" },
          { internalType: "int64", name: "quoteId", type: "int64" },
        ],
        internalType: "struct EthFlowOrder.Data[]",
        name: "orderArray",
        type: "tuple[]",
      },
    ],
    name: "invalidateOrdersIgnoringNotAllowed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "orderHash", type: "bytes32" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "isValidSignature",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "orders",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint32", name: "validTo", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "unwrap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "wrap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "wrapAll", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "wrappedNativeToken",
    outputs: [{ internalType: "contract IWrappedNativeToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

export const routerAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_factory",
        type: "address",
      },
      {
        internalType: "address",
        name: "_WNativeToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_poolDeployer",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "WNativeToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "amount0Delta",
        type: "int256",
      },
      {
        internalType: "int256",
        name: "amount1Delta",
        type: "int256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "algebraSwapCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes",
            name: "path",
            type: "bytes",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountIn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInput",
    outputs: [
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "tokenIn",
            type: "address",
          },
          {
            internalType: "address",
            name: "tokenOut",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountIn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
          {
            internalType: "uint160",
            name: "limitSqrtPrice",
            type: "uint160",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "tokenIn",
            type: "address",
          },
          {
            internalType: "address",
            name: "tokenOut",
            type: "address",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountIn",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
          {
            internalType: "uint160",
            name: "limitSqrtPrice",
            type: "uint160",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingleSupportingFeeOnTransferTokens",
    outputs: [
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes",
            name: "path",
            type: "bytes",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOut",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountInMaximum",
            type: "uint256",
          },
        ],
        internalType: "struct ISwapRouter.ExactOutputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactOutput",
    outputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "tokenIn",
            type: "address",
          },
          {
            internalType: "address",
            name: "tokenOut",
            type: "address",
          },
          {
            internalType: "uint24",
            name: "fee",
            type: "uint24",
          },
          {
            internalType: "address",
            name: "recipient",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountOut",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountInMaximum",
            type: "uint256",
          },
          {
            internalType: "uint160",
            name: "limitSqrtPrice",
            type: "uint160",
          },
        ],
        internalType: "struct ISwapRouter.ExactOutputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactOutputSingle",
    outputs: [
      {
        internalType: "uint256",
        name: "amountIn",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "poolDeployer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "refundNativeToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitAllowed",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitAllowedIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "selfPermitIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountMinimum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "sweepToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountMinimum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "feeBips",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "sweepTokenWithFee",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountMinimum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
    ],
    name: "unwrapWNativeToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountMinimum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "feeBips",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "unwrapWNativeTokenWithFee",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
