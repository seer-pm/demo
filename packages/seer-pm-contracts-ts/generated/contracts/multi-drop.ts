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
// GovernedRecipient
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const governedRecipientAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: '_newRecipients', internalType: 'address[]', type: 'address[]' },
    ],
    name: 'addRecipients',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_governor', internalType: 'address', type: 'address' }],
    name: 'changeGovernor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'governor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_user', internalType: 'address', type: 'address' }],
    name: 'isEligible',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'recipients',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_oldRecipients', internalType: 'address[]', type: 'address[]' },
    ],
    name: 'removeRecipients',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const governedRecipientAddress = {
  100: '0x9E850eB9699AC8417D3401ff1d89115214667b19',
  11155111: '0xBdF42243D843d34204f50CEC4F4308e432B511F6',
} as const

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const governedRecipientConfig = {
  address: governedRecipientAddress,
  abi: governedRecipientAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MultiDrop
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const multiDropAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_recipient',
        internalType: 'contract IRecipient',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokens', internalType: 'contract ERC20[]', type: 'address[]' },
      { name: '_amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'addTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'allTokens',
    outputs: [
      { name: '', internalType: 'contract ERC20[]', type: 'address[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'amounts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_governor', internalType: 'address', type: 'address' }],
    name: 'changeGovernor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_recipient',
        internalType: 'contract IRecipient',
        type: 'address',
      },
    ],
    name: 'changeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_i', internalType: 'uint256', type: 'uint256' },
      { name: '_token', internalType: 'contract ERC20', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'changeToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'claimed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'governor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'recipient',
    outputs: [
      { name: '', internalType: 'contract IRecipient', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'tokens',
    outputs: [{ name: '', internalType: 'contract ERC20', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const multiDropAddress = {
  100: '0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5',
  11155111: '0x591aF101cAf2b7351C74c25F5E64bC2E062D2843',
} as const

/**
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const multiDropConfig = {
  address: multiDropAddress,
  abi: multiDropAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useReadGovernedRecipient = /*#__PURE__*/ createUseReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useReadGovernedRecipientGovernor =
  /*#__PURE__*/ createUseReadContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'governor',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"isEligible"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useReadGovernedRecipientIsEligible =
  /*#__PURE__*/ createUseReadContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'isEligible',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"recipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useReadGovernedRecipientRecipients =
  /*#__PURE__*/ createUseReadContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'recipients',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useWriteGovernedRecipient = /*#__PURE__*/ createUseWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useWriteGovernedRecipientAddRecipients =
  /*#__PURE__*/ createUseWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'addRecipients',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useWriteGovernedRecipientChangeGovernor =
  /*#__PURE__*/ createUseWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useWriteGovernedRecipientRemoveRecipients =
  /*#__PURE__*/ createUseWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'removeRecipients',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useSimulateGovernedRecipient =
  /*#__PURE__*/ createUseSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useSimulateGovernedRecipientAddRecipients =
  /*#__PURE__*/ createUseSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'addRecipients',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useSimulateGovernedRecipientChangeGovernor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const useSimulateGovernedRecipientRemoveRecipients =
  /*#__PURE__*/ createUseSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'removeRecipients',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDrop = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"allTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropAllTokens = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'allTokens',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"amounts"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropAmounts = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'amounts',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claimed"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropClaimed = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'claimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropGovernor = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"recipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropRecipient = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'recipient',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"tokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useReadMultiDropTokens = /*#__PURE__*/ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'tokens',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDrop = /*#__PURE__*/ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDropAddTokens = /*#__PURE__*/ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'addTokens',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDropChangeGovernor =
  /*#__PURE__*/ createUseWriteContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDropChangeRecipient =
  /*#__PURE__*/ createUseWriteContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeRecipient',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDropChangeToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeToken',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useWriteMultiDropClaim = /*#__PURE__*/ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'claim',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDrop = /*#__PURE__*/ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDropAddTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'addTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDropChangeGovernor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDropChangeRecipient =
  /*#__PURE__*/ createUseSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeRecipient',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDropChangeToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const useSimulateMultiDropClaim =
  /*#__PURE__*/ createUseSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'claim',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const readGovernedRecipient = /*#__PURE__*/ createReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const readGovernedRecipientGovernor = /*#__PURE__*/ createReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"isEligible"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const readGovernedRecipientIsEligible = /*#__PURE__*/ createReadContract(
  {
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'isEligible',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"recipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const readGovernedRecipientRecipients = /*#__PURE__*/ createReadContract(
  {
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'recipients',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const writeGovernedRecipient = /*#__PURE__*/ createWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const writeGovernedRecipientAddRecipients =
  /*#__PURE__*/ createWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'addRecipients',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const writeGovernedRecipientChangeGovernor =
  /*#__PURE__*/ createWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const writeGovernedRecipientRemoveRecipients =
  /*#__PURE__*/ createWriteContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'removeRecipients',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const simulateGovernedRecipient = /*#__PURE__*/ createSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"addRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const simulateGovernedRecipientAddRecipients =
  /*#__PURE__*/ createSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'addRecipients',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const simulateGovernedRecipientChangeGovernor =
  /*#__PURE__*/ createSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link governedRecipientAbi}__ and `functionName` set to `"removeRecipients"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x9E850eB9699AC8417D3401ff1d89115214667b19)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xBdF42243D843d34204f50CEC4F4308e432B511F6)
 */
export const simulateGovernedRecipientRemoveRecipients =
  /*#__PURE__*/ createSimulateContract({
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: 'removeRecipients',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDrop = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"allTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropAllTokens = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'allTokens',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"amounts"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropAmounts = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'amounts',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claimed"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropClaimed = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'claimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropGovernor = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"recipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropRecipient = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'recipient',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"tokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const readMultiDropTokens = /*#__PURE__*/ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'tokens',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDrop = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDropAddTokens = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'addTokens',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDropChangeGovernor = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'changeGovernor',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDropChangeRecipient = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'changeRecipient',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDropChangeToken = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'changeToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const writeMultiDropClaim = /*#__PURE__*/ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'claim',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDrop = /*#__PURE__*/ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"addTokens"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDropAddTokens = /*#__PURE__*/ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'addTokens',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDropChangeGovernor =
  /*#__PURE__*/ createSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeRecipient"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDropChangeRecipient =
  /*#__PURE__*/ createSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeRecipient',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"changeToken"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDropChangeToken =
  /*#__PURE__*/ createSimulateContract({
    abi: multiDropAbi,
    address: multiDropAddress,
    functionName: 'changeToken',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link multiDropAbi}__ and `functionName` set to `"claim"`
 *
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x591aF101cAf2b7351C74c25F5E64bC2E062D2843)
 */
export const simulateMultiDropClaim = /*#__PURE__*/ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: 'claim',
})
