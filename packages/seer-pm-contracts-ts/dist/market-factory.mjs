// generated/contracts/market-factory.ts
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
var circlesMarketFactoryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_market", internalType: "address", type: "address" },
      { name: "_arbitrator", internalType: "address", type: "address" },
      {
        name: "_realitio",
        internalType: "contract IRealityETH_v3_0",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      },
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      { name: "_collateralToken", internalType: "address", type: "address" },
      {
        name: "_realityProxy",
        internalType: "contract RealityProxy",
        type: "address"
      },
      { name: "_questionTimeout", internalType: "uint32", type: "uint32" }
    ],
    stateMutability: "nonpayable"
  },
  { type: "error", inputs: [], name: "FailedDeployment" },
  {
    type: "error",
    inputs: [
      { name: "balance", internalType: "uint256", type: "uint256" },
      { name: "needed", internalType: "uint256", type: "uint256" }
    ],
    name: "InsufficientBalance"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "market",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "marketName",
        internalType: "string",
        type: "string",
        indexed: false
      },
      {
        name: "parentMarket",
        internalType: "address",
        type: "address",
        indexed: false
      },
      {
        name: "conditionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "questionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "questionsIds",
        internalType: "bytes32[]",
        type: "bytes32[]",
        indexed: false
      }
    ],
    name: "NewMarket"
  },
  {
    type: "function",
    inputs: [],
    name: "allMarkets",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "collateralToken",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createCategoricalMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createMultiCategoricalMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createMultiScalarMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createScalarMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "market",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "marketCount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "markets",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "questionTimeout",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realitio",
    outputs: [
      { name: "", internalType: "contract IRealityETH_v3_0", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realityProxy",
    outputs: [
      { name: "", internalType: "contract RealityProxy", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var circlesMarketFactoryAddress = {
  100: "0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E"
};
var circlesMarketFactoryConfig = {
  address: circlesMarketFactoryAddress,
  abi: circlesMarketFactoryAbi
};
var futarchyFactoryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_proposal", internalType: "address", type: "address" },
      { name: "_arbitrator", internalType: "address", type: "address" },
      {
        name: "_realitio",
        internalType: "contract IRealityETH_v3_0",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      },
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_realityProxy",
        internalType: "contract FutarchyRealityProxy",
        type: "address"
      },
      { name: "_questionTimeout", internalType: "uint32", type: "uint32" }
    ],
    stateMutability: "nonpayable"
  },
  { type: "error", inputs: [], name: "ERC1167FailedCreateClone" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "proposal",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "marketName",
        internalType: "string",
        type: "string",
        indexed: false
      },
      {
        name: "conditionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "questionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      }
    ],
    name: "NewProposal"
  },
  {
    type: "function",
    inputs: [],
    name: "allMarkets",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct FutarchyFactory.CreateProposalParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          {
            name: "collateralToken1",
            internalType: "contract IERC20",
            type: "address"
          },
          {
            name: "collateralToken2",
            internalType: "contract IERC20",
            type: "address"
          },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" }
        ]
      }
    ],
    name: "createProposal",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "marketsCount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "proposal",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "proposals",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "questionTimeout",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realitio",
    outputs: [
      { name: "", internalType: "contract IRealityETH_v3_0", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realityProxy",
    outputs: [
      {
        name: "",
        internalType: "contract FutarchyRealityProxy",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var futarchyFactoryAddress = {
  100: "0xa6cB18FCDC17a2B44E5cAd2d80a6D5942d30a345"
};
var futarchyFactoryConfig = {
  address: futarchyFactoryAddress,
  abi: futarchyFactoryAbi
};
var marketAbi = [
  {
    type: "function",
    inputs: [],
    name: "conditionId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokensParams",
    outputs: [
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "parentOutcome", internalType: "uint256", type: "uint256" },
      { name: "parentMarket", internalType: "address", type: "address" },
      { name: "questionId", internalType: "bytes32", type: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "index", internalType: "uint256", type: "uint256" }],
    name: "encodedQuestions",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_marketName", internalType: "string", type: "string" },
      { name: "_outcomes", internalType: "string[]", type: "string[]" },
      { name: "_lowerBound", internalType: "uint256", type: "uint256" },
      { name: "_upperBound", internalType: "uint256", type: "uint256" },
      {
        name: "_conditionalTokensParams",
        internalType: "struct Market.ConditionalTokensParams",
        type: "tuple",
        components: [
          { name: "conditionId", internalType: "bytes32", type: "bytes32" },
          {
            name: "parentCollectionId",
            internalType: "bytes32",
            type: "bytes32"
          },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "questionId", internalType: "bytes32", type: "bytes32" },
          {
            name: "wrapped1155",
            internalType: "contract IERC20[]",
            type: "address[]"
          },
          { name: "data", internalType: "bytes[]", type: "bytes[]" }
        ]
      },
      {
        name: "_realityParams",
        internalType: "struct Market.RealityParams",
        type: "tuple",
        components: [
          {
            name: "questionsIds",
            internalType: "bytes32[]",
            type: "bytes32[]"
          },
          { name: "templateId", internalType: "uint256", type: "uint256" },
          {
            name: "encodedQuestions",
            internalType: "string[]",
            type: "string[]"
          }
        ]
      },
      {
        name: "_realityProxy",
        internalType: "contract RealityProxy",
        type: "address"
      }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "initialized",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "lowerBound",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "marketName",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "numOutcomes",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "outcomes",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "parentCollectionId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "parentMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "parentOutcome",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "parentWrappedOutcome",
    outputs: [
      { name: "wrapped1155", internalType: "contract IERC20", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "questionId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "questionsIds",
    outputs: [{ name: "", internalType: "bytes32[]", type: "bytes32[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realityParams",
    outputs: [{ name: "templateId", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realityProxy",
    outputs: [
      { name: "", internalType: "contract RealityProxy", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "templateId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "upperBound",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "index", internalType: "uint256", type: "uint256" }],
    name: "wrappedOutcome",
    outputs: [
      { name: "wrapped1155", internalType: "contract IERC20", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" }
    ],
    stateMutability: "view"
  }
];
var marketAddress = {
  1: "0x8bdC504dC3A05310059c1c67E0A2667309D27B93",
  10: "0xAb797C4C6022A401c31543E316D3cd04c67a87fC",
  100: "0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a",
  8453: "0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E",
  11155111: "0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678"
};
var marketConfig = { address: marketAddress, abi: marketAbi };
var marketFactoryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_market", internalType: "address", type: "address" },
      { name: "_arbitrator", internalType: "address", type: "address" },
      {
        name: "_realitio",
        internalType: "contract IRealityETH_v3_0",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      },
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      { name: "_collateralToken", internalType: "address", type: "address" },
      {
        name: "_realityProxy",
        internalType: "contract RealityProxy",
        type: "address"
      },
      { name: "_questionTimeout", internalType: "uint32", type: "uint32" }
    ],
    stateMutability: "nonpayable"
  },
  { type: "error", inputs: [], name: "ERC1167FailedCreateClone" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "market",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "marketName",
        internalType: "string",
        type: "string",
        indexed: false
      },
      {
        name: "parentMarket",
        internalType: "address",
        type: "address",
        indexed: false
      },
      {
        name: "conditionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "questionId",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "questionsIds",
        internalType: "bytes32[]",
        type: "bytes32[]",
        indexed: false
      }
    ],
    name: "NewMarket"
  },
  {
    type: "function",
    inputs: [],
    name: "allMarkets",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "collateralToken",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createCategoricalMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createMultiCategoricalMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createMultiScalarMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "params",
        internalType: "struct MarketFactory.CreateMarketParams",
        type: "tuple",
        components: [
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          { name: "questionStart", internalType: "string", type: "string" },
          { name: "questionEnd", internalType: "string", type: "string" },
          { name: "outcomeType", internalType: "string", type: "string" },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "parentMarket", internalType: "address", type: "address" },
          { name: "category", internalType: "string", type: "string" },
          { name: "lang", internalType: "string", type: "string" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          { name: "minBond", internalType: "uint256", type: "uint256" },
          { name: "openingTime", internalType: "uint32", type: "uint32" },
          { name: "tokenNames", internalType: "string[]", type: "string[]" }
        ]
      }
    ],
    name: "createScalarMarket",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "market",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "marketCount",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "markets",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "questionTimeout",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realitio",
    outputs: [
      { name: "", internalType: "contract IRealityETH_v3_0", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "realityProxy",
    outputs: [
      { name: "", internalType: "contract RealityProxy", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var marketFactoryAddress = {
  1: "0x1F728c2fD6a3008935c1446a965a313E657b7904",
  10: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6",
  100: "0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1",
  8453: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6",
  11155111: "0x221456ACFD185EE168052B3DA899939303775C7a"
};
var marketFactoryConfig = {
  address: marketFactoryAddress,
  abi: marketFactoryAbi
};
var useReadCirclesMarketFactory = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var useReadCirclesMarketFactoryAllMarkets = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "allMarkets"
});
var useReadCirclesMarketFactoryArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "arbitrator"
});
var useReadCirclesMarketFactoryCollateralToken = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "collateralToken"
});
var useReadCirclesMarketFactoryConditionalTokens = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "conditionalTokens"
});
var useReadCirclesMarketFactoryMarket = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "market"
});
var useReadCirclesMarketFactoryMarketCount = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "marketCount"
});
var useReadCirclesMarketFactoryMarkets = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "markets"
});
var useReadCirclesMarketFactoryQuestionTimeout = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "questionTimeout"
});
var useReadCirclesMarketFactoryRealitio = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "realitio"
});
var useReadCirclesMarketFactoryRealityProxy = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "realityProxy"
});
var useReadCirclesMarketFactoryWrapped1155Factory = /* @__PURE__ */ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "wrapped1155Factory"
});
var useWriteCirclesMarketFactory = /* @__PURE__ */ createUseWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var useWriteCirclesMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createUseWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var useWriteCirclesMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createUseWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var useWriteCirclesMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createUseWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var useWriteCirclesMarketFactoryCreateScalarMarket = /* @__PURE__ */ createUseWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createScalarMarket"
});
var useSimulateCirclesMarketFactory = /* @__PURE__ */ createUseSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var useSimulateCirclesMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var useSimulateCirclesMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var useSimulateCirclesMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var useSimulateCirclesMarketFactoryCreateScalarMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createScalarMarket"
});
var useWatchCirclesMarketFactoryEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var useWatchCirclesMarketFactoryNewMarketEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  eventName: "NewMarket"
});
var useReadFutarchyFactory = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var useReadFutarchyFactoryAllMarkets = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "allMarkets"
});
var useReadFutarchyFactoryArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "arbitrator"
});
var useReadFutarchyFactoryConditionalTokens = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "conditionalTokens"
});
var useReadFutarchyFactoryMarketsCount = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "marketsCount"
});
var useReadFutarchyFactoryProposal = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "proposal"
});
var useReadFutarchyFactoryProposals = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "proposals"
});
var useReadFutarchyFactoryQuestionTimeout = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "questionTimeout"
});
var useReadFutarchyFactoryRealitio = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "realitio"
});
var useReadFutarchyFactoryRealityProxy = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "realityProxy"
});
var useReadFutarchyFactoryWrapped1155Factory = /* @__PURE__ */ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "wrapped1155Factory"
});
var useWriteFutarchyFactory = /* @__PURE__ */ createUseWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var useWriteFutarchyFactoryCreateProposal = /* @__PURE__ */ createUseWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "createProposal"
});
var useSimulateFutarchyFactory = /* @__PURE__ */ createUseSimulateContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var useSimulateFutarchyFactoryCreateProposal = /* @__PURE__ */ createUseSimulateContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "createProposal"
});
var useWatchFutarchyFactoryEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var useWatchFutarchyFactoryNewProposalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  eventName: "NewProposal"
});
var useReadMarket = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress
});
var useReadMarketConditionId = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "conditionId"
});
var useReadMarketConditionalTokensParams = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "conditionalTokensParams"
});
var useReadMarketEncodedQuestions = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "encodedQuestions"
});
var useReadMarketInitialized = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialized"
});
var useReadMarketLowerBound = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "lowerBound"
});
var useReadMarketMarketName = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "marketName"
});
var useReadMarketNumOutcomes = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "numOutcomes"
});
var useReadMarketOutcomes = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "outcomes"
});
var useReadMarketParentCollectionId = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentCollectionId"
});
var useReadMarketParentMarket = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentMarket"
});
var useReadMarketParentOutcome = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentOutcome"
});
var useReadMarketParentWrappedOutcome = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentWrappedOutcome"
});
var useReadMarketQuestionId = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "questionId"
});
var useReadMarketQuestionsIds = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "questionsIds"
});
var useReadMarketRealityParams = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "realityParams"
});
var useReadMarketRealityProxy = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "realityProxy"
});
var useReadMarketTemplateId = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "templateId"
});
var useReadMarketUpperBound = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "upperBound"
});
var useReadMarketWrappedOutcome = /* @__PURE__ */ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "wrappedOutcome"
});
var useWriteMarket = /* @__PURE__ */ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress
});
var useWriteMarketInitialize = /* @__PURE__ */ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialize"
});
var useWriteMarketResolve = /* @__PURE__ */ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "resolve"
});
var useSimulateMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: marketAbi,
  address: marketAddress
});
var useSimulateMarketInitialize = /* @__PURE__ */ createUseSimulateContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialize"
});
var useSimulateMarketResolve = /* @__PURE__ */ createUseSimulateContract(
  { abi: marketAbi, address: marketAddress, functionName: "resolve" }
);
var useReadMarketFactory = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var useReadMarketFactoryAllMarkets = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "allMarkets"
});
var useReadMarketFactoryArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "arbitrator"
});
var useReadMarketFactoryCollateralToken = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "collateralToken"
});
var useReadMarketFactoryConditionalTokens = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "conditionalTokens"
});
var useReadMarketFactoryMarket = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "market"
});
var useReadMarketFactoryMarketCount = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "marketCount"
});
var useReadMarketFactoryMarkets = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "markets"
});
var useReadMarketFactoryQuestionTimeout = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "questionTimeout"
});
var useReadMarketFactoryRealitio = /* @__PURE__ */ createUseReadContract(
  {
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: "realitio"
  }
);
var useReadMarketFactoryRealityProxy = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "realityProxy"
});
var useReadMarketFactoryWrapped1155Factory = /* @__PURE__ */ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "wrapped1155Factory"
});
var useWriteMarketFactory = /* @__PURE__ */ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var useWriteMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var useWriteMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var useWriteMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var useWriteMarketFactoryCreateScalarMarket = /* @__PURE__ */ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createScalarMarket"
});
var useSimulateMarketFactory = /* @__PURE__ */ createUseSimulateContract(
  { abi: marketFactoryAbi, address: marketFactoryAddress }
);
var useSimulateMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var useSimulateMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var useSimulateMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var useSimulateMarketFactoryCreateScalarMarket = /* @__PURE__ */ createUseSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createScalarMarket"
});
var useWatchMarketFactoryEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var useWatchMarketFactoryNewMarketEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  eventName: "NewMarket"
});
var readCirclesMarketFactory = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var readCirclesMarketFactoryAllMarkets = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "allMarkets"
});
var readCirclesMarketFactoryArbitrator = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "arbitrator"
});
var readCirclesMarketFactoryCollateralToken = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "collateralToken"
});
var readCirclesMarketFactoryConditionalTokens = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "conditionalTokens"
});
var readCirclesMarketFactoryMarket = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "market"
});
var readCirclesMarketFactoryMarketCount = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "marketCount"
});
var readCirclesMarketFactoryMarkets = /* @__PURE__ */ createReadContract(
  {
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: "markets"
  }
);
var readCirclesMarketFactoryQuestionTimeout = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "questionTimeout"
});
var readCirclesMarketFactoryRealitio = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "realitio"
});
var readCirclesMarketFactoryRealityProxy = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "realityProxy"
});
var readCirclesMarketFactoryWrapped1155Factory = /* @__PURE__ */ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "wrapped1155Factory"
});
var writeCirclesMarketFactory = /* @__PURE__ */ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var writeCirclesMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var writeCirclesMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var writeCirclesMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var writeCirclesMarketFactoryCreateScalarMarket = /* @__PURE__ */ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createScalarMarket"
});
var simulateCirclesMarketFactory = /* @__PURE__ */ createSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var simulateCirclesMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var simulateCirclesMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var simulateCirclesMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var simulateCirclesMarketFactoryCreateScalarMarket = /* @__PURE__ */ createSimulateContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: "createScalarMarket"
});
var watchCirclesMarketFactoryEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress
});
var watchCirclesMarketFactoryNewMarketEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  eventName: "NewMarket"
});
var readFutarchyFactory = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var readFutarchyFactoryAllMarkets = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "allMarkets"
});
var readFutarchyFactoryArbitrator = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "arbitrator"
});
var readFutarchyFactoryConditionalTokens = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "conditionalTokens"
});
var readFutarchyFactoryMarketsCount = /* @__PURE__ */ createReadContract(
  {
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: "marketsCount"
  }
);
var readFutarchyFactoryProposal = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "proposal"
});
var readFutarchyFactoryProposals = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "proposals"
});
var readFutarchyFactoryQuestionTimeout = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "questionTimeout"
});
var readFutarchyFactoryRealitio = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "realitio"
});
var readFutarchyFactoryRealityProxy = /* @__PURE__ */ createReadContract(
  {
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: "realityProxy"
  }
);
var readFutarchyFactoryWrapped1155Factory = /* @__PURE__ */ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "wrapped1155Factory"
});
var writeFutarchyFactory = /* @__PURE__ */ createWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var writeFutarchyFactoryCreateProposal = /* @__PURE__ */ createWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "createProposal"
});
var simulateFutarchyFactory = /* @__PURE__ */ createSimulateContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress
});
var simulateFutarchyFactoryCreateProposal = /* @__PURE__ */ createSimulateContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: "createProposal"
});
var watchFutarchyFactoryEvent = /* @__PURE__ */ createWatchContractEvent(
  { abi: futarchyFactoryAbi, address: futarchyFactoryAddress }
);
var watchFutarchyFactoryNewProposalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  eventName: "NewProposal"
});
var readMarket = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress
});
var readMarketConditionId = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "conditionId"
});
var readMarketConditionalTokensParams = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "conditionalTokensParams"
});
var readMarketEncodedQuestions = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "encodedQuestions"
});
var readMarketInitialized = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialized"
});
var readMarketLowerBound = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "lowerBound"
});
var readMarketMarketName = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "marketName"
});
var readMarketNumOutcomes = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "numOutcomes"
});
var readMarketOutcomes = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "outcomes"
});
var readMarketParentCollectionId = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentCollectionId"
});
var readMarketParentMarket = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentMarket"
});
var readMarketParentOutcome = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentOutcome"
});
var readMarketParentWrappedOutcome = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "parentWrappedOutcome"
});
var readMarketQuestionId = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "questionId"
});
var readMarketQuestionsIds = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "questionsIds"
});
var readMarketRealityParams = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "realityParams"
});
var readMarketRealityProxy = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "realityProxy"
});
var readMarketTemplateId = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "templateId"
});
var readMarketUpperBound = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "upperBound"
});
var readMarketWrappedOutcome = /* @__PURE__ */ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "wrappedOutcome"
});
var writeMarket = /* @__PURE__ */ createWriteContract({
  abi: marketAbi,
  address: marketAddress
});
var writeMarketInitialize = /* @__PURE__ */ createWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialize"
});
var writeMarketResolve = /* @__PURE__ */ createWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "resolve"
});
var simulateMarket = /* @__PURE__ */ createSimulateContract({
  abi: marketAbi,
  address: marketAddress
});
var simulateMarketInitialize = /* @__PURE__ */ createSimulateContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "initialize"
});
var simulateMarketResolve = /* @__PURE__ */ createSimulateContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: "resolve"
});
var readMarketFactory = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var readMarketFactoryAllMarkets = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "allMarkets"
});
var readMarketFactoryArbitrator = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "arbitrator"
});
var readMarketFactoryCollateralToken = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "collateralToken"
});
var readMarketFactoryConditionalTokens = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "conditionalTokens"
});
var readMarketFactoryMarket = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "market"
});
var readMarketFactoryMarketCount = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "marketCount"
});
var readMarketFactoryMarkets = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "markets"
});
var readMarketFactoryQuestionTimeout = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "questionTimeout"
});
var readMarketFactoryRealitio = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "realitio"
});
var readMarketFactoryRealityProxy = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "realityProxy"
});
var readMarketFactoryWrapped1155Factory = /* @__PURE__ */ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "wrapped1155Factory"
});
var writeMarketFactory = /* @__PURE__ */ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var writeMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var writeMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var writeMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var writeMarketFactoryCreateScalarMarket = /* @__PURE__ */ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createScalarMarket"
});
var simulateMarketFactory = /* @__PURE__ */ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var simulateMarketFactoryCreateCategoricalMarket = /* @__PURE__ */ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createCategoricalMarket"
});
var simulateMarketFactoryCreateMultiCategoricalMarket = /* @__PURE__ */ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiCategoricalMarket"
});
var simulateMarketFactoryCreateMultiScalarMarket = /* @__PURE__ */ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createMultiScalarMarket"
});
var simulateMarketFactoryCreateScalarMarket = /* @__PURE__ */ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: "createScalarMarket"
});
var watchMarketFactoryEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: marketFactoryAbi,
  address: marketFactoryAddress
});
var watchMarketFactoryNewMarketEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  eventName: "NewMarket"
});
export {
  circlesMarketFactoryAbi,
  circlesMarketFactoryAddress,
  circlesMarketFactoryConfig,
  futarchyFactoryAbi,
  futarchyFactoryAddress,
  futarchyFactoryConfig,
  marketAbi,
  marketAddress,
  marketConfig,
  marketFactoryAbi,
  marketFactoryAddress,
  marketFactoryConfig,
  readCirclesMarketFactory,
  readCirclesMarketFactoryAllMarkets,
  readCirclesMarketFactoryArbitrator,
  readCirclesMarketFactoryCollateralToken,
  readCirclesMarketFactoryConditionalTokens,
  readCirclesMarketFactoryMarket,
  readCirclesMarketFactoryMarketCount,
  readCirclesMarketFactoryMarkets,
  readCirclesMarketFactoryQuestionTimeout,
  readCirclesMarketFactoryRealitio,
  readCirclesMarketFactoryRealityProxy,
  readCirclesMarketFactoryWrapped1155Factory,
  readFutarchyFactory,
  readFutarchyFactoryAllMarkets,
  readFutarchyFactoryArbitrator,
  readFutarchyFactoryConditionalTokens,
  readFutarchyFactoryMarketsCount,
  readFutarchyFactoryProposal,
  readFutarchyFactoryProposals,
  readFutarchyFactoryQuestionTimeout,
  readFutarchyFactoryRealitio,
  readFutarchyFactoryRealityProxy,
  readFutarchyFactoryWrapped1155Factory,
  readMarket,
  readMarketConditionId,
  readMarketConditionalTokensParams,
  readMarketEncodedQuestions,
  readMarketFactory,
  readMarketFactoryAllMarkets,
  readMarketFactoryArbitrator,
  readMarketFactoryCollateralToken,
  readMarketFactoryConditionalTokens,
  readMarketFactoryMarket,
  readMarketFactoryMarketCount,
  readMarketFactoryMarkets,
  readMarketFactoryQuestionTimeout,
  readMarketFactoryRealitio,
  readMarketFactoryRealityProxy,
  readMarketFactoryWrapped1155Factory,
  readMarketInitialized,
  readMarketLowerBound,
  readMarketMarketName,
  readMarketNumOutcomes,
  readMarketOutcomes,
  readMarketParentCollectionId,
  readMarketParentMarket,
  readMarketParentOutcome,
  readMarketParentWrappedOutcome,
  readMarketQuestionId,
  readMarketQuestionsIds,
  readMarketRealityParams,
  readMarketRealityProxy,
  readMarketTemplateId,
  readMarketUpperBound,
  readMarketWrappedOutcome,
  simulateCirclesMarketFactory,
  simulateCirclesMarketFactoryCreateCategoricalMarket,
  simulateCirclesMarketFactoryCreateMultiCategoricalMarket,
  simulateCirclesMarketFactoryCreateMultiScalarMarket,
  simulateCirclesMarketFactoryCreateScalarMarket,
  simulateFutarchyFactory,
  simulateFutarchyFactoryCreateProposal,
  simulateMarket,
  simulateMarketFactory,
  simulateMarketFactoryCreateCategoricalMarket,
  simulateMarketFactoryCreateMultiCategoricalMarket,
  simulateMarketFactoryCreateMultiScalarMarket,
  simulateMarketFactoryCreateScalarMarket,
  simulateMarketInitialize,
  simulateMarketResolve,
  useReadCirclesMarketFactory,
  useReadCirclesMarketFactoryAllMarkets,
  useReadCirclesMarketFactoryArbitrator,
  useReadCirclesMarketFactoryCollateralToken,
  useReadCirclesMarketFactoryConditionalTokens,
  useReadCirclesMarketFactoryMarket,
  useReadCirclesMarketFactoryMarketCount,
  useReadCirclesMarketFactoryMarkets,
  useReadCirclesMarketFactoryQuestionTimeout,
  useReadCirclesMarketFactoryRealitio,
  useReadCirclesMarketFactoryRealityProxy,
  useReadCirclesMarketFactoryWrapped1155Factory,
  useReadFutarchyFactory,
  useReadFutarchyFactoryAllMarkets,
  useReadFutarchyFactoryArbitrator,
  useReadFutarchyFactoryConditionalTokens,
  useReadFutarchyFactoryMarketsCount,
  useReadFutarchyFactoryProposal,
  useReadFutarchyFactoryProposals,
  useReadFutarchyFactoryQuestionTimeout,
  useReadFutarchyFactoryRealitio,
  useReadFutarchyFactoryRealityProxy,
  useReadFutarchyFactoryWrapped1155Factory,
  useReadMarket,
  useReadMarketConditionId,
  useReadMarketConditionalTokensParams,
  useReadMarketEncodedQuestions,
  useReadMarketFactory,
  useReadMarketFactoryAllMarkets,
  useReadMarketFactoryArbitrator,
  useReadMarketFactoryCollateralToken,
  useReadMarketFactoryConditionalTokens,
  useReadMarketFactoryMarket,
  useReadMarketFactoryMarketCount,
  useReadMarketFactoryMarkets,
  useReadMarketFactoryQuestionTimeout,
  useReadMarketFactoryRealitio,
  useReadMarketFactoryRealityProxy,
  useReadMarketFactoryWrapped1155Factory,
  useReadMarketInitialized,
  useReadMarketLowerBound,
  useReadMarketMarketName,
  useReadMarketNumOutcomes,
  useReadMarketOutcomes,
  useReadMarketParentCollectionId,
  useReadMarketParentMarket,
  useReadMarketParentOutcome,
  useReadMarketParentWrappedOutcome,
  useReadMarketQuestionId,
  useReadMarketQuestionsIds,
  useReadMarketRealityParams,
  useReadMarketRealityProxy,
  useReadMarketTemplateId,
  useReadMarketUpperBound,
  useReadMarketWrappedOutcome,
  useSimulateCirclesMarketFactory,
  useSimulateCirclesMarketFactoryCreateCategoricalMarket,
  useSimulateCirclesMarketFactoryCreateMultiCategoricalMarket,
  useSimulateCirclesMarketFactoryCreateMultiScalarMarket,
  useSimulateCirclesMarketFactoryCreateScalarMarket,
  useSimulateFutarchyFactory,
  useSimulateFutarchyFactoryCreateProposal,
  useSimulateMarket,
  useSimulateMarketFactory,
  useSimulateMarketFactoryCreateCategoricalMarket,
  useSimulateMarketFactoryCreateMultiCategoricalMarket,
  useSimulateMarketFactoryCreateMultiScalarMarket,
  useSimulateMarketFactoryCreateScalarMarket,
  useSimulateMarketInitialize,
  useSimulateMarketResolve,
  useWatchCirclesMarketFactoryEvent,
  useWatchCirclesMarketFactoryNewMarketEvent,
  useWatchFutarchyFactoryEvent,
  useWatchFutarchyFactoryNewProposalEvent,
  useWatchMarketFactoryEvent,
  useWatchMarketFactoryNewMarketEvent,
  useWriteCirclesMarketFactory,
  useWriteCirclesMarketFactoryCreateCategoricalMarket,
  useWriteCirclesMarketFactoryCreateMultiCategoricalMarket,
  useWriteCirclesMarketFactoryCreateMultiScalarMarket,
  useWriteCirclesMarketFactoryCreateScalarMarket,
  useWriteFutarchyFactory,
  useWriteFutarchyFactoryCreateProposal,
  useWriteMarket,
  useWriteMarketFactory,
  useWriteMarketFactoryCreateCategoricalMarket,
  useWriteMarketFactoryCreateMultiCategoricalMarket,
  useWriteMarketFactoryCreateMultiScalarMarket,
  useWriteMarketFactoryCreateScalarMarket,
  useWriteMarketInitialize,
  useWriteMarketResolve,
  watchCirclesMarketFactoryEvent,
  watchCirclesMarketFactoryNewMarketEvent,
  watchFutarchyFactoryEvent,
  watchFutarchyFactoryNewProposalEvent,
  watchMarketFactoryEvent,
  watchMarketFactoryNewMarketEvent,
  writeCirclesMarketFactory,
  writeCirclesMarketFactoryCreateCategoricalMarket,
  writeCirclesMarketFactoryCreateMultiCategoricalMarket,
  writeCirclesMarketFactoryCreateMultiScalarMarket,
  writeCirclesMarketFactoryCreateScalarMarket,
  writeFutarchyFactory,
  writeFutarchyFactoryCreateProposal,
  writeMarket,
  writeMarketFactory,
  writeMarketFactoryCreateCategoricalMarket,
  writeMarketFactoryCreateMultiCategoricalMarket,
  writeMarketFactoryCreateMultiScalarMarket,
  writeMarketFactoryCreateScalarMarket,
  writeMarketInitialize,
  writeMarketResolve
};
