import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
} from 'wagmi/codegen'

import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ConditionalRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const conditionalRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
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
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getWinningOutcomes',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      {
        name: 'parentOutcomeIndexes',
        internalType: 'uint256[]',
        type: 'uint256[]',
      },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemConditionalToCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const conditionalRouterAddress = {
  1: '0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5',
  10: '0x3124e97ebF4c9592A17d40E54623953Ff3c77a73',
  100: '0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c',
  8453: '0xF5ccbf74121edBa492725F325D55356D517723B9',
  11155111: '0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const conditionalRouterConfig = {
  address: conditionalRouterAddress,
  abi: conditionalRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// FutarchyRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const futarchyRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
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
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getWinningOutcomes',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'proposal',
        internalType: 'contract FutarchyProposal',
        type: 'address',
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'proposal',
        internalType: 'contract FutarchyProposal',
        type: 'address',
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'proposal',
        internalType: 'contract FutarchyProposal',
        type: 'address',
      },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'amount2', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'redeemProposal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'proposal',
        internalType: 'contract FutarchyProposal',
        type: 'address',
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const futarchyRouterAddress = {
  100: '0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const futarchyRouterConfig = {
  address: futarchyRouterAddress,
  abi: futarchyRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GnosisRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const gnosisRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
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
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getWinningOutcomes',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergeToBase',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemToBase',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'sDAI',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'savingsXDaiAdapter',
    outputs: [
      {
        name: '',
        internalType: 'contract ISavingsXDaiAdapter',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
    ],
    name: 'splitFromBase',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const gnosisRouterAddress = {
  100: '0xeC9048b59b3467415b1a38F63416407eA0c70fB8',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const gnosisRouterConfig = {
  address: gnosisRouterAddress,
  abi: gnosisRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MainnetRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const mainnetRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DAI',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
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
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getWinningOutcomes',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergeToDai',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemToDai',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'sDAI',
    outputs: [
      { name: '', internalType: 'contract ISavingsDai', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitFromDai',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const mainnetRouterAddress = {
  1: '0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const mainnetRouterConfig = {
  address: mainnetRouterAddress,
  abi: mainnetRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const routerAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_conditionalTokens',
        internalType: 'contract IConditionalTokens',
        type: 'address',
      },
      {
        name: '_wrapped1155Factory',
        internalType: 'contract IWrapped1155Factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
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
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getWinningOutcomes',
    outputs: [{ name: '', internalType: 'bool[]', type: 'bool[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'outcomeIndexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const routerAddress = {
  10: '0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD',
  8453: '0x3124e97ebF4c9592A17d40E54623953Ff3c77a73',
  11155111: '0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const routerConfig = { address: routerAddress, abi: routerAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouter = /*#__PURE__*/ createUseReadContract({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouterConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouterGetTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'getTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouterGetWinningOutcomes =
  /*#__PURE__*/ createUseReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useReadConditionalRouterWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouter = /*#__PURE__*/ createUseWriteContract({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterMergePositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterOnErc1155Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemConditionalToCollateral"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterRedeemConditionalToCollateral =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemConditionalToCollateral',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterRedeemPositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useWriteConditionalRouterSplitPosition =
  /*#__PURE__*/ createUseWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouter =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterMergePositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterOnErc1155Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemConditionalToCollateral"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterRedeemConditionalToCollateral =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemConditionalToCollateral',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterRedeemPositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const useSimulateConditionalRouterSplitPosition =
  /*#__PURE__*/ createUseSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouter = /*#__PURE__*/ createUseReadContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouterConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouterGetTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'getTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouterGetWinningOutcomes =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useReadFutarchyRouterWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouter = /*#__PURE__*/ createUseWriteContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterMergePositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterOnErc1155Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterRedeemPositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterRedeemProposal =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemProposal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useWriteFutarchyRouterSplitPosition =
  /*#__PURE__*/ createUseWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouter =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterMergePositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterOnErc1155Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterRedeemPositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterRedeemProposal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemProposal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const useSimulateFutarchyRouterSplitPosition =
  /*#__PURE__*/ createUseSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouter = /*#__PURE__*/ createUseReadContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterGetTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'getTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterGetWinningOutcomes =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"sDAI"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterSDai = /*#__PURE__*/ createUseReadContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: 'sDAI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"savingsXDaiAdapter"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterSavingsXDaiAdapter =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'savingsXDaiAdapter',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useReadGnosisRouterWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouter = /*#__PURE__*/ createUseWriteContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterMergePositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergeToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterMergeToBase =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergeToBase',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterOnErc1155Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterRedeemPositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterRedeemToBase =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemToBase',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitFromBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterSplitFromBase =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitFromBase',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useWriteGnosisRouterSplitPosition =
  /*#__PURE__*/ createUseWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouter = /*#__PURE__*/ createUseSimulateContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterMergePositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergeToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterMergeToBase =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergeToBase',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterOnErc1155Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterRedeemPositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterRedeemToBase =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemToBase',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitFromBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterSplitFromBase =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitFromBase',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const useSimulateGnosisRouterSplitPosition =
  /*#__PURE__*/ createUseSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouter = /*#__PURE__*/ createUseReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"DAI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterDai = /*#__PURE__*/ createUseReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'DAI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterGetTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'getTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterGetWinningOutcomes =
  /*#__PURE__*/ createUseReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"sDAI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterSDai = /*#__PURE__*/ createUseReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'sDAI',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useReadMainnetRouterWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouter = /*#__PURE__*/ createUseWriteContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterMergePositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergeToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterMergeToDai =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergeToDai',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterOnErc1155Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterRedeemPositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterRedeemToDai =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemToDai',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitFromDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterSplitFromDai =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitFromDai',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useWriteMainnetRouterSplitPosition =
  /*#__PURE__*/ createUseWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouter = /*#__PURE__*/ createUseSimulateContract(
  { abi: mainnetRouterAbi, address: mainnetRouterAddress },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterMergePositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergeToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterMergeToDai =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergeToDai',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterOnErc1155Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterRedeemPositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterRedeemToDai =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemToDai',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitFromDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterSplitFromDai =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitFromDai',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const useSimulateMainnetRouterSplitPosition =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouter = /*#__PURE__*/ createUseReadContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouterConditionalTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"getTokenId"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouterGetTokenId = /*#__PURE__*/ createUseReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'getTokenId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouterGetWinningOutcomes =
  /*#__PURE__*/ createUseReadContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouterSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useReadRouterWrapped1155Factory =
  /*#__PURE__*/ createUseReadContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouter = /*#__PURE__*/ createUseWriteContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouterMergePositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseWriteContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouterOnErc1155Received =
  /*#__PURE__*/ createUseWriteContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouterRedeemPositions =
  /*#__PURE__*/ createUseWriteContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useWriteRouterSplitPosition = /*#__PURE__*/ createUseWriteContract(
  { abi: routerAbi, address: routerAddress, functionName: 'splitPosition' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouter = /*#__PURE__*/ createUseSimulateContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouterMergePositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createUseSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouterOnErc1155Received =
  /*#__PURE__*/ createUseSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouterRedeemPositions =
  /*#__PURE__*/ createUseSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const useSimulateRouterSplitPosition =
  /*#__PURE__*/ createUseSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'splitPosition',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouter = /*#__PURE__*/ createReadContract({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouterConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouterGetTokenId = /*#__PURE__*/ createReadContract(
  {
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'getTokenId',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouterGetWinningOutcomes =
  /*#__PURE__*/ createReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouterSupportsInterface =
  /*#__PURE__*/ createReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const readConditionalRouterWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouter = /*#__PURE__*/ createWriteContract({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterMergePositions =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterOnErc1155Received =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemConditionalToCollateral"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterRedeemConditionalToCollateral =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemConditionalToCollateral',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterRedeemPositions =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const writeConditionalRouterSplitPosition =
  /*#__PURE__*/ createWriteContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouter = /*#__PURE__*/ createSimulateContract({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterMergePositions =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterOnErc1155Received =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemConditionalToCollateral"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterRedeemConditionalToCollateral =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemConditionalToCollateral',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterRedeemPositions =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link conditionalRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xF5ccbf74121edBa492725F325D55356D517723B9)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5)
 */
export const simulateConditionalRouterSplitPosition =
  /*#__PURE__*/ createSimulateContract({
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouter = /*#__PURE__*/ createReadContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouterConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouterGetTokenId = /*#__PURE__*/ createReadContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: 'getTokenId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouterGetWinningOutcomes =
  /*#__PURE__*/ createReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouterSupportsInterface =
  /*#__PURE__*/ createReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const readFutarchyRouterWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouter = /*#__PURE__*/ createWriteContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterMergePositions =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterOnErc1155Received =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterRedeemPositions =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterRedeemProposal =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemProposal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const writeFutarchyRouterSplitPosition =
  /*#__PURE__*/ createWriteContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouter = /*#__PURE__*/ createSimulateContract({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterMergePositions =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterOnErc1155Received =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterRedeemPositions =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"redeemProposal"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterRedeemProposal =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'redeemProposal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link futarchyRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E)
 */
export const simulateFutarchyRouterSplitPosition =
  /*#__PURE__*/ createSimulateContract({
    abi: futarchyRouterAbi,
    address: futarchyRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouter = /*#__PURE__*/ createReadContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterGetTokenId = /*#__PURE__*/ createReadContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: 'getTokenId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterGetWinningOutcomes =
  /*#__PURE__*/ createReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"sDAI"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterSDai = /*#__PURE__*/ createReadContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: 'sDAI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"savingsXDaiAdapter"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterSavingsXDaiAdapter =
  /*#__PURE__*/ createReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'savingsXDaiAdapter',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterSupportsInterface =
  /*#__PURE__*/ createReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const readGnosisRouterWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouter = /*#__PURE__*/ createWriteContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterMergePositions =
  /*#__PURE__*/ createWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergeToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterMergeToBase = /*#__PURE__*/ createWriteContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: 'mergeToBase',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterOnErc1155Received =
  /*#__PURE__*/ createWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterRedeemPositions =
  /*#__PURE__*/ createWriteContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterRedeemToBase = /*#__PURE__*/ createWriteContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: 'redeemToBase',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitFromBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterSplitFromBase = /*#__PURE__*/ createWriteContract(
  {
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitFromBase',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const writeGnosisRouterSplitPosition = /*#__PURE__*/ createWriteContract(
  {
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitPosition',
  },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouter = /*#__PURE__*/ createSimulateContract({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterMergePositions =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"mergeToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterMergeToBase =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'mergeToBase',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterOnErc1155Received =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterRedeemPositions =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"redeemToBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterRedeemToBase =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'redeemToBase',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitFromBase"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterSplitFromBase =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitFromBase',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link gnosisRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xeC9048b59b3467415b1a38F63416407eA0c70fB8)
 */
export const simulateGnosisRouterSplitPosition =
  /*#__PURE__*/ createSimulateContract({
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouter = /*#__PURE__*/ createReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"DAI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterDai = /*#__PURE__*/ createReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'DAI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterConditionalTokens =
  /*#__PURE__*/ createReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'conditionalTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"getTokenId"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterGetTokenId = /*#__PURE__*/ createReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'getTokenId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterGetWinningOutcomes =
  /*#__PURE__*/ createReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'getWinningOutcomes',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"sDAI"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterSDai = /*#__PURE__*/ createReadContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'sDAI',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterSupportsInterface =
  /*#__PURE__*/ createReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const readMainnetRouterWrapped1155Factory =
  /*#__PURE__*/ createReadContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'wrapped1155Factory',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouter = /*#__PURE__*/ createWriteContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterMergePositions =
  /*#__PURE__*/ createWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergeToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterMergeToDai = /*#__PURE__*/ createWriteContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'mergeToDai',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterOnErc1155Received =
  /*#__PURE__*/ createWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterRedeemPositions =
  /*#__PURE__*/ createWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterRedeemToDai = /*#__PURE__*/ createWriteContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: 'redeemToDai',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitFromDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterSplitFromDai = /*#__PURE__*/ createWriteContract(
  {
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitFromDai',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const writeMainnetRouterSplitPosition =
  /*#__PURE__*/ createWriteContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouter = /*#__PURE__*/ createSimulateContract({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergePositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterMergePositions =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"mergeToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterMergeToDai =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'mergeToDai',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterOnErc1155Received =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterRedeemPositions =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"redeemToDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterRedeemToDai =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'redeemToDai',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitFromDai"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterSplitFromDai =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitFromDai',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link mainnetRouterAbi}__ and `functionName` set to `"splitPosition"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6)
 */
export const simulateMainnetRouterSplitPosition =
  /*#__PURE__*/ createSimulateContract({
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: 'splitPosition',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouter = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"conditionalTokens"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouterConditionalTokens = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'conditionalTokens',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"getTokenId"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouterGetTokenId = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'getTokenId',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"getWinningOutcomes"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouterGetWinningOutcomes = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'getWinningOutcomes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"supportsInterface"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouterSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"wrapped1155Factory"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const readRouterWrapped1155Factory = /*#__PURE__*/ createReadContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'wrapped1155Factory',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouter = /*#__PURE__*/ createWriteContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouterMergePositions = /*#__PURE__*/ createWriteContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'mergePositions',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createWriteContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouterOnErc1155Received = /*#__PURE__*/ createWriteContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'onERC1155Received',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouterRedeemPositions = /*#__PURE__*/ createWriteContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'redeemPositions',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const writeRouterSplitPosition = /*#__PURE__*/ createWriteContract({
  abi: routerAbi,
  address: routerAddress,
  functionName: 'splitPosition',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouter = /*#__PURE__*/ createSimulateContract({
  abi: routerAbi,
  address: routerAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"mergePositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouterMergePositions =
  /*#__PURE__*/ createSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'mergePositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155BatchReceived"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouterOnErc1155BatchReceived =
  /*#__PURE__*/ createSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155BatchReceived',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"onERC1155Received"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouterOnErc1155Received =
  /*#__PURE__*/ createSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'onERC1155Received',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"redeemPositions"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouterRedeemPositions =
  /*#__PURE__*/ createSimulateContract({
    abi: routerAbi,
    address: routerAddress,
    functionName: 'redeemPositions',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link routerAbi}__ and `functionName` set to `"splitPosition"`
 *
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3124e97ebF4c9592A17d40E54623953Ff3c77a73)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791)
 */
export const simulateRouterSplitPosition = /*#__PURE__*/ createSimulateContract(
  { abi: routerAbi, address: routerAddress, functionName: 'splitPosition' },
)
