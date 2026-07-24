/**
 * Minimal ABIs for trade execution (CoW EthFlow + ERC20 approve).
 */

export const ETH_FLOW_ABI = [
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
] as const;

export const ERC20_APPROVE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
