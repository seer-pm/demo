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
// CreditsManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const creditsManagerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract ERC20', type: 'address' },
      {
        name: '_seerCredits',
        internalType: 'contract SeerCredits',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_user', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'canSpendCredits',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'outputToken', internalType: 'contract ERC20', type: 'address' },
    ],
    name: 'execute',
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
    inputs: [],
    name: 'seerCredits',
    outputs: [
      { name: '', internalType: 'contract SeerCredits', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_contract', internalType: 'address', type: 'address' },
      { name: '_whitelisted', internalType: 'bool', type: 'bool' },
    ],
    name: 'setWhitelistedContract',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_token', internalType: 'contract ERC20', type: 'address' },
    ],
    name: 'sweepTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract ERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'whitelistedContracts',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const creditsManagerAddress = {
  100: '0xB29D0C9875D93483891c0645fdC13D665a4d2D70',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const creditsManagerConfig = {
  address: creditsManagerAddress,
  abi: creditsManagerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SeerCredits
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const seerCreditsAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_governor', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_addresses', internalType: 'address[]', type: 'address[]' },
      { name: '_amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'addCreditsBalance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_creditsManager', internalType: 'address', type: 'address' },
    ],
    name: 'changeCreditsManager',
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
    name: 'creditsManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
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
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isAdmin',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_admin', internalType: 'address', type: 'address' },
      { name: '_isAdmin', internalType: 'bool', type: 'bool' },
    ],
    name: 'setAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_addresses', internalType: 'address[]', type: 'address[]' },
      { name: '_amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'setCreditsBalance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const seerCreditsAddress = {
  100: '0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF',
} as const

/**
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const seerCreditsConfig = {
  address: seerCreditsAddress,
  abi: seerCreditsAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManager = /*#__PURE__*/ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"canSpendCredits"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManagerCanSpendCredits =
  /*#__PURE__*/ createUseReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'canSpendCredits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"governor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManagerGovernor =
  /*#__PURE__*/ createUseReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'governor',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"seerCredits"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManagerSeerCredits =
  /*#__PURE__*/ createUseReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'seerCredits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"token"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManagerToken = /*#__PURE__*/ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"whitelistedContracts"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useReadCreditsManagerWhitelistedContracts =
  /*#__PURE__*/ createUseReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'whitelistedContracts',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useWriteCreditsManager = /*#__PURE__*/ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useWriteCreditsManagerChangeGovernor =
  /*#__PURE__*/ createUseWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"execute"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useWriteCreditsManagerExecute =
  /*#__PURE__*/ createUseWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'execute',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"setWhitelistedContract"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useWriteCreditsManagerSetWhitelistedContract =
  /*#__PURE__*/ createUseWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'setWhitelistedContract',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"sweepTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useWriteCreditsManagerSweepTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'sweepTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useSimulateCreditsManager =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useSimulateCreditsManagerChangeGovernor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"execute"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useSimulateCreditsManagerExecute =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'execute',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"setWhitelistedContract"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useSimulateCreditsManagerSetWhitelistedContract =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'setWhitelistedContract',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"sweepTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const useSimulateCreditsManagerSweepTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'sweepTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCredits = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"allowance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsAllowance = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"creditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsCreditsManager =
  /*#__PURE__*/ createUseReadContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'creditsManager',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"decimals"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsDecimals = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"governor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsGovernor = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"isAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsIsAdmin = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'isAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsName = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"nonces"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsNonces = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsSymbol = /*#__PURE__*/ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useReadSeerCreditsTotalSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'totalSupply',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCredits = /*#__PURE__*/ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"addCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsAddCreditsBalance =
  /*#__PURE__*/ createUseWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'addCreditsBalance',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsApprove = /*#__PURE__*/ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsBurn = /*#__PURE__*/ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'burn',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeCreditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsChangeCreditsManager =
  /*#__PURE__*/ createUseWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeCreditsManager',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsChangeGovernor =
  /*#__PURE__*/ createUseWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsMint = /*#__PURE__*/ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsPermit = /*#__PURE__*/ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsSetAdmin = /*#__PURE__*/ createUseWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setAdmin',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsSetCreditsBalance =
  /*#__PURE__*/ createUseWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setCreditsBalance',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsTransfer = /*#__PURE__*/ createUseWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transfer',
  },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWriteSeerCreditsTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCredits = /*#__PURE__*/ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"addCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsAddCreditsBalance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'addCreditsBalance',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsBurn =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'burn',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeCreditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsChangeCreditsManager =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeCreditsManager',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsChangeGovernor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsMint =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'mint',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsSetAdmin =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setAdmin',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsSetCreditsBalance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setCreditsBalance',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useSimulateSeerCreditsTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWatchSeerCreditsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWatchSeerCreditsApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const useWatchSeerCreditsTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    eventName: 'Transfer',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManager = /*#__PURE__*/ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"canSpendCredits"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManagerCanSpendCredits =
  /*#__PURE__*/ createReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'canSpendCredits',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"governor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManagerGovernor = /*#__PURE__*/ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"seerCredits"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManagerSeerCredits = /*#__PURE__*/ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: 'seerCredits',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"token"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManagerToken = /*#__PURE__*/ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"whitelistedContracts"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const readCreditsManagerWhitelistedContracts =
  /*#__PURE__*/ createReadContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'whitelistedContracts',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const writeCreditsManager = /*#__PURE__*/ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const writeCreditsManagerChangeGovernor =
  /*#__PURE__*/ createWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"execute"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const writeCreditsManagerExecute = /*#__PURE__*/ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: 'execute',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"setWhitelistedContract"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const writeCreditsManagerSetWhitelistedContract =
  /*#__PURE__*/ createWriteContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'setWhitelistedContract',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"sweepTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const writeCreditsManagerSweepTokens = /*#__PURE__*/ createWriteContract(
  {
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'sweepTokens',
  },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link creditsManagerAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const simulateCreditsManager = /*#__PURE__*/ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const simulateCreditsManagerChangeGovernor =
  /*#__PURE__*/ createSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"execute"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const simulateCreditsManagerExecute =
  /*#__PURE__*/ createSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'execute',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"setWhitelistedContract"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const simulateCreditsManagerSetWhitelistedContract =
  /*#__PURE__*/ createSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'setWhitelistedContract',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link creditsManagerAbi}__ and `functionName` set to `"sweepTokens"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xB29D0C9875D93483891c0645fdC13D665a4d2D70)
 */
export const simulateCreditsManagerSweepTokens =
  /*#__PURE__*/ createSimulateContract({
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: 'sweepTokens',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCredits = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsDomainSeparator = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'DOMAIN_SEPARATOR',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"allowance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsAllowance = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"balanceOf"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsBalanceOf = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"creditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsCreditsManager = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'creditsManager',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"decimals"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsDecimals = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"governor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsGovernor = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'governor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"isAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsIsAdmin = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'isAdmin',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"name"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsName = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"nonces"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsNonces = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"symbol"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsSymbol = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"totalSupply"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const readSeerCreditsTotalSupply = /*#__PURE__*/ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCredits = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"addCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsAddCreditsBalance =
  /*#__PURE__*/ createWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'addCreditsBalance',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsApprove = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsBurn = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'burn',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeCreditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsChangeCreditsManager =
  /*#__PURE__*/ createWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeCreditsManager',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsChangeGovernor = /*#__PURE__*/ createWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeGovernor',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsMint = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsPermit = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsSetAdmin = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'setAdmin',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsSetCreditsBalance =
  /*#__PURE__*/ createWriteContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setCreditsBalance',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsTransfer = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const writeSeerCreditsTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCredits = /*#__PURE__*/ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"addCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsAddCreditsBalance =
  /*#__PURE__*/ createSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'addCreditsBalance',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"approve"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsApprove = /*#__PURE__*/ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"burn"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsBurn = /*#__PURE__*/ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'burn',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeCreditsManager"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsChangeCreditsManager =
  /*#__PURE__*/ createSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeCreditsManager',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsChangeGovernor =
  /*#__PURE__*/ createSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"mint"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsMint = /*#__PURE__*/ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"permit"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsPermit = /*#__PURE__*/ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setAdmin"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsSetAdmin = /*#__PURE__*/ createSimulateContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setAdmin',
  },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"setCreditsBalance"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsSetCreditsBalance =
  /*#__PURE__*/ createSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'setCreditsBalance',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsTransfer = /*#__PURE__*/ createSimulateContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transfer',
  },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link seerCreditsAbi}__ and `functionName` set to `"transferFrom"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const simulateSeerCreditsTransferFrom =
  /*#__PURE__*/ createSimulateContract({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const watchSeerCreditsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__ and `eventName` set to `"Approval"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const watchSeerCreditsApprovalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link seerCreditsAbi}__ and `eventName` set to `"Transfer"`
 *
 * [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF)
 */
export const watchSeerCreditsTransferEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    eventName: 'Transfer',
  })
