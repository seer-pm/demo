export const PSM3_ABI = [
  {
    inputs: [
      { internalType: "address", name: "assetIn", type: "address" },
      { internalType: "address", name: "assetOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
    ],
    name: "previewSwapExactIn",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "assetIn", type: "address" },
      { internalType: "address", name: "assetOut", type: "address" },
      { internalType: "uint256", name: "amountOut", type: "uint256" },
    ],
    name: "previewSwapExactOut",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "assetIn", type: "address" },
      { internalType: "address", name: "assetOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "minAmountOut", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "uint256", name: "referralCode", type: "uint256" },
    ],
    name: "swapExactIn",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "assetIn", type: "address" },
      { internalType: "address", name: "assetOut", type: "address" },
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "maxAmountIn", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "uint256", name: "referralCode", type: "uint256" },
    ],
    name: "swapExactOut",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const PSM3_REFERRAL_CODE = 1n;
