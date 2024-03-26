export const ArbitratorAbi = [
  {
    type: "function",
    stateMutability: "view",
    payable: false,
    outputs: [
      {
        type: "uint256",
        name: "cost",
      },
    ],
    name: "arbitrationCost",
    inputs: [
      {
        type: "bytes",
        name: "_extraData",
      },
    ],
    constant: true,
  },
] as const;
