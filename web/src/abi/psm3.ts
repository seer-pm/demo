export const PSM3_ABI = [
  {
    inputs: [
      { name: "assetIn", type: "address" },
      { name: "assetOut", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    name: "previewSwapExactIn",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "assetIn", type: "address" },
      { name: "assetOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "referralCode", type: "uint256" },
    ],
    name: "swapExactIn",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const PSM3_REFERRAL_CODE = 1n;
