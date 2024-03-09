export const RouterAbi = [
  {
    inputs: [
      {
        internalType: "contract IConditionalTokens",
        name: "_conditionalTokens",
        type: "address",
      },
      {
        internalType: "contract WrappedERC20Factory",
        name: "_wrappedERC20Factory",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        internalType: "contract IConditionalTokens",
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
        internalType: "contract IERC20",
        name: "collateralToken",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "indexSet",
        type: "uint256",
      },
    ],
    name: "getTokenAddress",
    outputs: [
      {
        internalType: "contract IERC20",
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
        internalType: "contract IERC20",
        name: "collateralToken",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "indexSet",
        type: "uint256",
      },
    ],
    name: "getTokenId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
    ],
    name: "getWinningOutcomes",
    outputs: [
      {
        internalType: "bool[]",
        name: "",
        type: "bool[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "collateralToken",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "partition",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC1155BatchReceived",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC1155Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "collateralToken",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "indexSets",
        type: "uint256[]",
      },
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "collateralToken",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "conditionId",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "partition",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wrappedERC20Factory",
    outputs: [
      {
        internalType: "contract WrappedERC20Factory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
