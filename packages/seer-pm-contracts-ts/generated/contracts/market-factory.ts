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
// CirclesMarketFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const circlesMarketFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_market', internalType: 'address', type: 'address' },
      { name: '_arbitrator', internalType: 'address', type: 'address' },
      {
        name: '_realitio',
        internalType: 'contract IRealityETH_v3_0',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      { name: '_collateralToken', internalType: 'address', type: 'address' },
      {
        name: '_realityProxy',
        internalType: 'contract RealityProxy',
        type: 'address',
      },
      { name: '_questionTimeout', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'market',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'marketName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'parentMarket',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'questionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'questionsIds',
        internalType: 'bytes32[]',
        type: 'bytes32[]',
        indexed: false,
      },
    ],
    name: 'NewMarket',
  },
  {
    type: 'function',
    inputs: [],
    name: 'allMarkets',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'collateralToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'conditionalTokens',
    outputs: [
      {
        name: '',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createCategoricalMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createMultiCategoricalMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createMultiScalarMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createScalarMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'market',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'markets',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'questionTimeout',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realitio',
    outputs: [
      { name: '', internalType: 'contract IRealityETH_v3_0', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realityProxy',
    outputs: [
      { name: '', internalType: 'contract RealityProxy', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrapped1155Factory',
    outputs: [
      {
        name: '',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const circlesMarketFactoryAddress = {
  100: '0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const circlesMarketFactoryConfig = {
  address: circlesMarketFactoryAddress,
  abi: circlesMarketFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FutarchyFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const futarchyFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_proposal', internalType: 'address', type: 'address' },
      { name: '_arbitrator', internalType: 'address', type: 'address' },
      {
        name: '_realitio',
        internalType: 'contract IRealityETH_v3_0',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_realityProxy',
        internalType: 'contract FutarchyRealityProxy',
        type: 'address',
      },
      { name: '_questionTimeout', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'ERC1167FailedCreateClone' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposal',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'marketName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'questionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'NewProposal',
  },
  {
    type: 'function',
    inputs: [],
    name: 'allMarkets',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'conditionalTokens',
    outputs: [
      {
        name: '',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct FutarchyFactory.CreateProposalParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          {
            name: 'collateralToken1',
            internalType: 'contract IERC20',
            type: 'address',
          },
          {
            name: 'collateralToken2',
            internalType: 'contract IERC20',
            type: 'address',
          },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'createProposal',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'marketsCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposal',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'proposals',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'questionTimeout',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realitio',
    outputs: [
      { name: '', internalType: 'contract IRealityETH_v3_0', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realityProxy',
    outputs: [
      {
        name: '',
        internalType: 'contract FutarchyRealityProxy',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrapped1155Factory',
    outputs: [
      {
        name: '',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const futarchyFactoryAddress = {
  100: '0xa6cB18FCDC17a2B44E5cAd2d80a6D5942d30a345',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const futarchyFactoryConfig = {
  address: futarchyFactoryAddress,
  abi: futarchyFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Market
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const marketAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'conditionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'conditionalTokensParams',
    outputs: [
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
      { name: 'parentMarket', internalType: 'address', type: 'address' },
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'encodedQuestions',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_marketName', internalType: 'string', type: 'string' },
      { name: '_outcomes', internalType: 'string[]', type: 'string[]' },
      { name: '_lowerBound', internalType: 'uint256', type: 'uint256' },
      { name: '_upperBound', internalType: 'uint256', type: 'uint256' },
      {
        name: '_conditionalTokensParams',
        internalType: 'struct Market.ConditionalTokensParams',
        type: 'tuple',
        components: [
          { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'parentCollectionId',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'wrapped1155',
            internalType: 'contract IERC20[]',
            type: 'address[]',
          },
          { name: 'data', internalType: 'bytes[]', type: 'bytes[]' },
        ],
      },
      {
        name: '_realityParams',
        internalType: 'struct Market.RealityParams',
        type: 'tuple',
        components: [
          {
            name: 'questionsIds',
            internalType: 'bytes32[]',
            type: 'bytes32[]',
          },
          { name: 'templateId', internalType: 'uint256', type: 'uint256' },
          {
            name: 'encodedQuestions',
            internalType: 'string[]',
            type: 'string[]',
          },
        ],
      },
      {
        name: '_realityProxy',
        internalType: 'contract RealityProxy',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'initialized',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lowerBound',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'marketName',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'numOutcomes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'outcomes',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'parentCollectionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'parentMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'parentOutcome',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'parentWrappedOutcome',
    outputs: [
      { name: 'wrapped1155', internalType: 'contract IERC20', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'questionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'questionsIds',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realityParams',
    outputs: [{ name: 'templateId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realityProxy',
    outputs: [
      { name: '', internalType: 'contract RealityProxy', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'resolve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'templateId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'upperBound',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'wrappedOutcome',
    outputs: [
      { name: 'wrapped1155', internalType: 'contract IERC20', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const marketAddress = {
  1: '0x8bdC504dC3A05310059c1c67E0A2667309D27B93',
  10: '0xAb797C4C6022A401c31543E316D3cd04c67a87fC',
  100: '0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a',
  8453: '0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E',
  11155111: '0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const marketConfig = { address: marketAddress, abi: marketAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MarketFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const marketFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_market', internalType: 'address', type: 'address' },
      { name: '_arbitrator', internalType: 'address', type: 'address' },
      {
        name: '_realitio',
        internalType: 'contract IRealityETH_v3_0',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      { name: '_collateralToken', internalType: 'address', type: 'address' },
      {
        name: '_realityProxy',
        internalType: 'contract RealityProxy',
        type: 'address',
      },
      { name: '_questionTimeout', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'ERC1167FailedCreateClone' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'market',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'marketName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'parentMarket',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'questionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'questionsIds',
        internalType: 'bytes32[]',
        type: 'bytes32[]',
        indexed: false,
      },
    ],
    name: 'NewMarket',
  },
  {
    type: 'function',
    inputs: [],
    name: 'allMarkets',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'collateralToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'conditionalTokens',
    outputs: [
      {
        name: '',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createCategoricalMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createMultiCategoricalMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createMultiScalarMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct MarketFactory.CreateMarketParams',
        type: 'tuple',
        components: [
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          { name: 'questionStart', internalType: 'string', type: 'string' },
          { name: 'questionEnd', internalType: 'string', type: 'string' },
          { name: 'outcomeType', internalType: 'string', type: 'string' },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'parentMarket', internalType: 'address', type: 'address' },
          { name: 'category', internalType: 'string', type: 'string' },
          { name: 'lang', internalType: 'string', type: 'string' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          { name: 'minBond', internalType: 'uint256', type: 'uint256' },
          { name: 'openingTime', internalType: 'uint32', type: 'uint32' },
          { name: 'tokenNames', internalType: 'string[]', type: 'string[]' },
        ],
      },
    ],
    name: 'createScalarMarket',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'market',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'markets',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'questionTimeout',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realitio',
    outputs: [
      { name: '', internalType: 'contract IRealityETH_v3_0', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realityProxy',
    outputs: [
      { name: '', internalType: 'contract RealityProxy', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrapped1155Factory',
    outputs: [
      {
        name: '',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const marketFactoryAddress = {
  1: '0x1F728c2fD6a3008935c1446a965a313E657b7904',
  10: '0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6',
  100: '0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1',
  8453: '0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6',
  11155111: '0x221456ACFD185EE168052B3DA899939303775C7a',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const marketFactoryConfig = {
  address: marketFactoryAddress,
  abi: marketFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactory = /*#__PURE__*/ createUseReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryAllMarkets =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'allMarkets',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"collateralToken"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryCollateralToken =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'collateralToken',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"market"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryMarket =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'market',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"marketCount"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryMarketCount =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'marketCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"markets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryMarkets =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'markets',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryQuestionTimeout =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryRealitio =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'realitio',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryRealityProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'realityProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useReadCirclesMarketFactoryWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWriteCirclesMarketFactory =
  /*#__PURE__*/ createUseWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWriteCirclesMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWriteCirclesMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWriteCirclesMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWriteCirclesMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useSimulateCirclesMarketFactory =
  /*#__PURE__*/ createUseSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useSimulateCirclesMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useSimulateCirclesMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useSimulateCirclesMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useSimulateCirclesMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWatchCirclesMarketFactoryEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `eventName` set to `"NewMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const useWatchCirclesMarketFactoryNewMarketEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    eventName: 'NewMarket',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactory = /*#__PURE__*/ createUseReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryAllMarkets =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'allMarkets',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"marketsCount"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryMarketsCount =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'marketsCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"proposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryProposal =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'proposal',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"proposals"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryProposals =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'proposals',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryQuestionTimeout =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryRealitio =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'realitio',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryRealityProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'realityProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useReadFutarchyFactoryWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useWriteFutarchyFactory = /*#__PURE__*/ createUseWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"createProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useWriteFutarchyFactoryCreateProposal =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'createProposal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useSimulateFutarchyFactory =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"createProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useSimulateFutarchyFactoryCreateProposal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'createProposal',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useWatchFutarchyFactoryEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `eventName` set to `"NewProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const useWatchFutarchyFactoryNewProposalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    eventName: 'NewProposal',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarket = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"conditionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketConditionId = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'conditionId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"conditionalTokensParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketConditionalTokensParams =
  /*#__PURE__*/ createUseReadContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'conditionalTokensParams',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"encodedQuestions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketEncodedQuestions =
  /*#__PURE__*/ createUseReadContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'encodedQuestions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketInitialized = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'initialized',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"lowerBound"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketLowerBound = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'lowerBound',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"marketName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketMarketName = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'marketName',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"numOutcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketNumOutcomes = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'numOutcomes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"outcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketOutcomes = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'outcomes',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentCollectionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketParentCollectionId =
  /*#__PURE__*/ createUseReadContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'parentCollectionId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketParentMarket = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentMarket',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketParentOutcome = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentOutcome',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentWrappedOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketParentWrappedOutcome =
  /*#__PURE__*/ createUseReadContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'parentWrappedOutcome',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"questionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketQuestionId = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'questionId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"questionsIds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketQuestionsIds = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'questionsIds',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"realityParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketRealityParams = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'realityParams',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"realityProxy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketRealityProxy = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'realityProxy',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"templateId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketTemplateId = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'templateId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"upperBound"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketUpperBound = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'upperBound',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"wrappedOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useReadMarketWrappedOutcome = /*#__PURE__*/ createUseReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'wrappedOutcome',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useWriteMarket = /*#__PURE__*/ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useWriteMarketInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"resolve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useWriteMarketResolve = /*#__PURE__*/ createUseWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'resolve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useSimulateMarket = /*#__PURE__*/ createUseSimulateContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useSimulateMarketInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"resolve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const useSimulateMarketResolve = /*#__PURE__*/ createUseSimulateContract(
  { abi: marketAbi, address: marketAddress, functionName: 'resolve' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactory = /*#__PURE__*/ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryAllMarkets =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'allMarkets',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"collateralToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryCollateralToken =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'collateralToken',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"market"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryMarket = /*#__PURE__*/ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'market',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"marketCount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryMarketCount =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'marketCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"markets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryMarkets = /*#__PURE__*/ createUseReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'markets',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryQuestionTimeout =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryRealitio = /*#__PURE__*/ createUseReadContract(
  {
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'realitio',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryRealityProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'realityProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useReadMarketFactoryWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWriteMarketFactory = /*#__PURE__*/ createUseWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWriteMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWriteMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWriteMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWriteMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createUseWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useSimulateMarketFactory = /*#__PURE__*/ createUseSimulateContract(
  { abi: marketFactoryAbi, address: marketFactoryAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useSimulateMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useSimulateMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useSimulateMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useSimulateMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createUseSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWatchMarketFactoryEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link marketFactoryAbi}__ and `eventName` set to `"NewMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const useWatchMarketFactoryNewMarketEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    eventName: 'NewMarket',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactory = /*#__PURE__*/ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryAllMarkets =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'allMarkets',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"collateralToken"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryCollateralToken =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'collateralToken',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"market"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryMarket = /*#__PURE__*/ createReadContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
  functionName: 'market',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"marketCount"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryMarketCount =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'marketCount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"markets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryMarkets = /*#__PURE__*/ createReadContract(
  {
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'markets',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryQuestionTimeout =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryRealitio =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'realitio',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryRealityProxy =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'realityProxy',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const readCirclesMarketFactoryWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const writeCirclesMarketFactory = /*#__PURE__*/ createWriteContract({
  abi: circlesMarketFactoryAbi,
  address: circlesMarketFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const writeCirclesMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const writeCirclesMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const writeCirclesMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const writeCirclesMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createWriteContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const simulateCirclesMarketFactory =
  /*#__PURE__*/ createSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const simulateCirclesMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const simulateCirclesMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const simulateCirclesMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const simulateCirclesMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link circlesMarketFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const watchCirclesMarketFactoryEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link circlesMarketFactoryAbi}__ and `eventName` set to `"NewMarket"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x2e3937cefF8e0AC5563B5D212Bbe8f6CB8ECB68E)
 */
export const watchCirclesMarketFactoryNewMarketEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: circlesMarketFactoryAbi,
    address: circlesMarketFactoryAddress,
    eventName: 'NewMarket',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactory = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryAllMarkets = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: 'allMarkets',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryArbitrator = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: 'arbitrator',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"marketsCount"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryMarketsCount = /*#__PURE__*/ createReadContract(
  {
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'marketsCount',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"proposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryProposal = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: 'proposal',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"proposals"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryProposals = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: 'proposals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryQuestionTimeout =
  /*#__PURE__*/ createReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryRealitio = /*#__PURE__*/ createReadContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
  functionName: 'realitio',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryRealityProxy = /*#__PURE__*/ createReadContract(
  {
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'realityProxy',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const readFutarchyFactoryWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const writeFutarchyFactory = /*#__PURE__*/ createWriteContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"createProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const writeFutarchyFactoryCreateProposal =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'createProposal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const simulateFutarchyFactory = /*#__PURE__*/ createSimulateContract({
  abi: futarchyFactoryAbi,
  address: futarchyFactoryAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `functionName` set to `"createProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const simulateFutarchyFactoryCreateProposal =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    functionName: 'createProposal',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link futarchyFactoryAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const watchFutarchyFactoryEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: futarchyFactoryAbi, address: futarchyFactoryAddress },
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link futarchyFactoryAbi}__ and `eventName` set to `"NewProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xa6cb18fcdc17a2b44e5cad2d80a6d5942d30a345)
 */
export const watchFutarchyFactoryNewProposalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: futarchyFactoryAbi,
    address: futarchyFactoryAddress,
    eventName: 'NewProposal',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarket = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"conditionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketConditionId = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'conditionId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"conditionalTokensParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketConditionalTokensParams =
  /*#__PURE__*/ createReadContract({
    abi: marketAbi,
    address: marketAddress,
    functionName: 'conditionalTokensParams',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"encodedQuestions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketEncodedQuestions = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'encodedQuestions',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketInitialized = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'initialized',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"lowerBound"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketLowerBound = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'lowerBound',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"marketName"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketMarketName = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'marketName',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"numOutcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketNumOutcomes = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'numOutcomes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"outcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketOutcomes = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'outcomes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentCollectionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketParentCollectionId = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentCollectionId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketParentMarket = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentMarket',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketParentOutcome = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentOutcome',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"parentWrappedOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketParentWrappedOutcome = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'parentWrappedOutcome',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"questionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketQuestionId = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'questionId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"questionsIds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketQuestionsIds = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'questionsIds',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"realityParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketRealityParams = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'realityParams',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"realityProxy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketRealityProxy = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'realityProxy',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"templateId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketTemplateId = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'templateId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"upperBound"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketUpperBound = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'upperBound',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"wrappedOutcome"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const readMarketWrappedOutcome = /*#__PURE__*/ createReadContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'wrappedOutcome',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const writeMarket = /*#__PURE__*/ createWriteContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const writeMarketInitialize = /*#__PURE__*/ createWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"resolve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const writeMarketResolve = /*#__PURE__*/ createWriteContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'resolve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const simulateMarket = /*#__PURE__*/ createSimulateContract({
  abi: marketAbi,
  address: marketAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const simulateMarketInitialize = /*#__PURE__*/ createSimulateContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketAbi}__ and `functionName` set to `"resolve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x8bdC504dC3A05310059c1c67E0A2667309D27B93)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xAb797C4C6022A401c31543E316D3cd04c67a87fC)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x8F76bC35F8C72E5e2Ec55ebED785da5efaa9636a)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xC72f738e331b6B7A5d77661277074BB60Ca0Ca9E)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xf9369c0F7a84CAC3b7Ef78c837cF7313309D3678)
 */
export const simulateMarketResolve = /*#__PURE__*/ createSimulateContract({
  abi: marketAbi,
  address: marketAddress,
  functionName: 'resolve',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactory = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"allMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryAllMarkets = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'allMarkets',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryArbitrator = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'arbitrator',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"collateralToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryCollateralToken =
  /*#__PURE__*/ createReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'collateralToken',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"market"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryMarket = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'market',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"marketCount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryMarketCount = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'marketCount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"markets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryMarkets = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'markets',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"questionTimeout"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryQuestionTimeout =
  /*#__PURE__*/ createReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'questionTimeout',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"realitio"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryRealitio = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'realitio',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"realityProxy"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryRealityProxy = /*#__PURE__*/ createReadContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
  functionName: 'realityProxy',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const readMarketFactoryWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const writeMarketFactory = /*#__PURE__*/ createWriteContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const writeMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const writeMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const writeMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const writeMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createWriteContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const simulateMarketFactory = /*#__PURE__*/ createSimulateContract({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const simulateMarketFactoryCreateCategoricalMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createCategoricalMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiCategoricalMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const simulateMarketFactoryCreateMultiCategoricalMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiCategoricalMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createMultiScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const simulateMarketFactoryCreateMultiScalarMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createMultiScalarMarket',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link marketFactoryAbi}__ and `functionName` set to `"createScalarMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const simulateMarketFactoryCreateScalarMarket =
  /*#__PURE__*/ createSimulateContract({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    functionName: 'createScalarMarket',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link marketFactoryAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const watchMarketFactoryEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: marketFactoryAbi,
  address: marketFactoryAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link marketFactoryAbi}__ and `eventName` set to `"NewMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1F728c2fD6a3008935c1446a965a313E657b7904)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x83183DA839Ce8228E31Ae41222EaD9EDBb5cDcf1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x221456ACFD185EE168052B3DA899939303775C7a)
 */
export const watchMarketFactoryNewMarketEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: marketFactoryAbi,
    address: marketFactoryAddress,
    eventName: 'NewMarket',
  })
