import { createUseReadContract } from 'wagmi/codegen'

import { createReadContract } from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MarketView
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const marketViewAbi = [
  {
    type: 'function',
    inputs: [
      {
        name: 'marketFactory',
        internalType: 'contract IMarketFactory',
        type: 'address',
      },
      { name: 'market', internalType: 'contract Market', type: 'address' },
    ],
    name: 'getMarket',
    outputs: [
      {
        name: '',
        internalType: 'struct MarketView.MarketInfo',
        type: 'tuple',
        components: [
          { name: 'id', internalType: 'address', type: 'address' },
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          {
            name: 'parentMarket',
            internalType: 'struct MarketView.ParentMarketInfo',
            type: 'tuple',
            components: [
              { name: 'id', internalType: 'address', type: 'address' },
              { name: 'marketName', internalType: 'string', type: 'string' },
              { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
              {
                name: 'wrappedTokens',
                internalType: 'address[]',
                type: 'address[]',
              },
              { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
              { name: 'payoutReported', internalType: 'bool', type: 'bool' },
              {
                name: 'payoutNumerators',
                internalType: 'uint256[]',
                type: 'uint256[]',
              },
            ],
          },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralToken', internalType: 'address', type: 'address' },
          {
            name: 'wrappedTokens',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'outcomesSupply', internalType: 'uint256', type: 'uint256' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          {
            name: 'parentCollectionId',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'collateralToken1',
            internalType: 'address',
            type: 'address',
          },
          {
            name: 'collateralToken2',
            internalType: 'address',
            type: 'address',
          },
          { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'templateId', internalType: 'uint256', type: 'uint256' },
          {
            name: 'questions',
            internalType: 'struct IRealityETH_v3_0.Question[]',
            type: 'tuple[]',
            components: [
              {
                name: 'content_hash',
                internalType: 'bytes32',
                type: 'bytes32',
              },
              { name: 'arbitrator', internalType: 'address', type: 'address' },
              { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
              { name: 'timeout', internalType: 'uint32', type: 'uint32' },
              { name: 'finalize_ts', internalType: 'uint32', type: 'uint32' },
              {
                name: 'is_pending_arbitration',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'bounty', internalType: 'uint256', type: 'uint256' },
              { name: 'best_answer', internalType: 'bytes32', type: 'bytes32' },
              {
                name: 'history_hash',
                internalType: 'bytes32',
                type: 'bytes32',
              },
              { name: 'bond', internalType: 'uint256', type: 'uint256' },
              { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'questionsIds',
            internalType: 'bytes32[]',
            type: 'bytes32[]',
          },
          {
            name: 'encodedQuestions',
            internalType: 'string[]',
            type: 'string[]',
          },
          { name: 'payoutReported', internalType: 'bool', type: 'bool' },
          {
            name: 'payoutNumerators',
            internalType: 'uint256[]',
            type: 'uint256[]',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'count', internalType: 'uint256', type: 'uint256' },
      {
        name: 'marketFactory',
        internalType: 'contract IMarketFactory',
        type: 'address',
      },
    ],
    name: 'getMarkets',
    outputs: [
      {
        name: '',
        internalType: 'struct MarketView.MarketInfo[]',
        type: 'tuple[]',
        components: [
          { name: 'id', internalType: 'address', type: 'address' },
          { name: 'marketName', internalType: 'string', type: 'string' },
          { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
          {
            name: 'parentMarket',
            internalType: 'struct MarketView.ParentMarketInfo',
            type: 'tuple',
            components: [
              { name: 'id', internalType: 'address', type: 'address' },
              { name: 'marketName', internalType: 'string', type: 'string' },
              { name: 'outcomes', internalType: 'string[]', type: 'string[]' },
              {
                name: 'wrappedTokens',
                internalType: 'address[]',
                type: 'address[]',
              },
              { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
              { name: 'payoutReported', internalType: 'bool', type: 'bool' },
              {
                name: 'payoutNumerators',
                internalType: 'uint256[]',
                type: 'uint256[]',
              },
            ],
          },
          { name: 'parentOutcome', internalType: 'uint256', type: 'uint256' },
          { name: 'collateralToken', internalType: 'address', type: 'address' },
          {
            name: 'wrappedTokens',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'outcomesSupply', internalType: 'uint256', type: 'uint256' },
          { name: 'lowerBound', internalType: 'uint256', type: 'uint256' },
          { name: 'upperBound', internalType: 'uint256', type: 'uint256' },
          {
            name: 'parentCollectionId',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'collateralToken1',
            internalType: 'address',
            type: 'address',
          },
          {
            name: 'collateralToken2',
            internalType: 'address',
            type: 'address',
          },
          { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'templateId', internalType: 'uint256', type: 'uint256' },
          {
            name: 'questions',
            internalType: 'struct IRealityETH_v3_0.Question[]',
            type: 'tuple[]',
            components: [
              {
                name: 'content_hash',
                internalType: 'bytes32',
                type: 'bytes32',
              },
              { name: 'arbitrator', internalType: 'address', type: 'address' },
              { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
              { name: 'timeout', internalType: 'uint32', type: 'uint32' },
              { name: 'finalize_ts', internalType: 'uint32', type: 'uint32' },
              {
                name: 'is_pending_arbitration',
                internalType: 'bool',
                type: 'bool',
              },
              { name: 'bounty', internalType: 'uint256', type: 'uint256' },
              { name: 'best_answer', internalType: 'bytes32', type: 'bytes32' },
              {
                name: 'history_hash',
                internalType: 'bytes32',
                type: 'bytes32',
              },
              { name: 'bond', internalType: 'uint256', type: 'uint256' },
              { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'questionsIds',
            internalType: 'bytes32[]',
            type: 'bytes32[]',
          },
          {
            name: 'encodedQuestions',
            internalType: 'string[]',
            type: 'string[]',
          },
          { name: 'payoutReported', internalType: 'bool', type: 'bool' },
          {
            name: 'payoutNumerators',
            internalType: 'uint256[]',
            type: 'uint256[]',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'realitio',
        internalType: 'contract IRealityETH_v3_0',
        type: 'address',
      },
    ],
    name: 'getQuestionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const marketViewAddress = {
  1: '0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a',
  10: '0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00',
  100: '0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C',
  8453: '0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD',
  11155111: '0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const marketViewConfig = {
  address: marketViewAddress,
  abi: marketViewAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const useReadMarketView = /*#__PURE__*/ createUseReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const useReadMarketViewGetMarket = /*#__PURE__*/ createUseReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: 'getMarket',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const useReadMarketViewGetMarkets = /*#__PURE__*/ createUseReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: 'getMarkets',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getQuestionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const useReadMarketViewGetQuestionId =
  /*#__PURE__*/ createUseReadContract({
    abi: marketViewAbi,
    address: marketViewAddress,
    functionName: 'getQuestionId',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const readMarketView = /*#__PURE__*/ createReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarket"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const readMarketViewGetMarket = /*#__PURE__*/ createReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: 'getMarket',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getMarkets"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const readMarketViewGetMarkets = /*#__PURE__*/ createReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: 'getMarkets',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link marketViewAbi}__ and `functionName` set to `"getQuestionId"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA)
 */
export const readMarketViewGetQuestionId = /*#__PURE__*/ createReadContract({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: 'getQuestionId',
})
