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
// RealitioForeignArbitrationProxyWithAppeals
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const realitioForeignArbitrationProxyWithAppealsAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_amb', internalType: 'contract IAMB', type: 'address' },
      { name: '_homeProxy', internalType: 'address', type: 'address' },
      { name: '_homeChainId', internalType: 'bytes32', type: 'bytes32' },
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      { name: '_metaEvidence', internalType: 'string', type: 'string' },
      { name: '_termsOfService', internalType: 'string', type: 'string' },
      { name: '_winnerMultiplier', internalType: 'uint256', type: 'uint256' },
      { name: '_loserMultiplier', internalType: 'uint256', type: 'uint256' },
      {
        name: '_loserAppealPeriodMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ArbitrationCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationFailed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_maxPrevious',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ArbitrationRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Contribution',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Dispute',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_party',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'Evidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MetaEvidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Ruling',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RulingFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawal',
  },
  {
    type: 'function',
    inputs: [],
    name: 'META_EVIDENCE_ID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MULTIPLIER_DIVISOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'amb',
    outputs: [{ name: '', internalType: 'contract IAMB', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToDisputeExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToRequester',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'arbitrationRequests',
    outputs: [
      {
        name: 'status',
        internalType: 'enum RealitioForeignArbitrationProxyWithAppeals.Status',
        type: 'uint8',
      },
      { name: 'deposit', internalType: 'uint248', type: 'uint248' },
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      { name: 'answer', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [
      { name: '', internalType: 'contract IArbitrator', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitratorExtraData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'disputeIDToDisputeDetails',
    outputs: [
      { name: 'arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: 'requester', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_externalDisputeID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'externalIDtoLocalID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fundAppeal',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_contributor', internalType: 'address', type: 'address' },
    ],
    name: 'getContributionsToSuccessfulFundings',
    outputs: [
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'contributions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getDisputeFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getFundingStatus',
    outputs: [
      { name: 'raised', internalType: 'uint256', type: 'uint256' },
      { name: 'fullyFunded', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMultipliers',
    outputs: [
      { name: 'winner', internalType: 'uint256', type: 'uint256' },
      { name: 'loser', internalType: 'uint256', type: 'uint256' },
      { name: 'loserAppealPeriod', internalType: 'uint256', type: 'uint256' },
      { name: 'divisor', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getNumberOfRounds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundInfo',
    outputs: [
      { name: 'paidFees', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'feeRewards', internalType: 'uint256', type: 'uint256' },
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTotalWithdrawableAmount',
    outputs: [{ name: 'sum', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'handleFailedDisputeCreation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'homeChainId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'homeProxy',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserAppealPeriodMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'numberOfRulingOptions',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_questionID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'questionIDToArbitrationID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationAcknowledgement',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationCancelation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'requestArbitration',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_disputeID', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_evidenceURI', internalType: 'string', type: 'string' },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'termsOfService',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'winnerMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewards',
    outputs: [{ name: 'reward', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewardsForAllRounds',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const realitioForeignArbitrationProxyWithAppealsAddress = {
  1: '0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const realitioForeignArbitrationProxyWithAppealsConfig = {
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RealitioForeignProxyBase
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const realitioForeignProxyBaseAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_wNative', internalType: 'address', type: 'address' },
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      { name: '_metaEvidence', internalType: 'string', type: 'string' },
      { name: '_winnerMultiplier', internalType: 'uint256', type: 'uint256' },
      { name: '_loserMultiplier', internalType: 'uint256', type: 'uint256' },
      {
        name: '_loserAppealPeriodMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: '_homeProxy', internalType: 'address', type: 'address' },
      { name: '_messenger', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ArbitrationCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationFailed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_maxPrevious',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ArbitrationRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Contribution',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Dispute',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_party',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'Evidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MetaEvidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Ruling',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RulingFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: '_ruling',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'RulingRelayed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawal',
  },
  {
    type: 'function',
    inputs: [],
    name: 'META_EVIDENCE_ID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_GAS_LIMIT',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MULTIPLIER_DIVISOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'REFUSE_TO_ARBITRATE_REALITIO',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationCreatedBlock',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToDisputeExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToRequester',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'arbitrationRequests',
    outputs: [
      {
        name: 'status',
        internalType: 'enum RealitioForeignProxyOptimism.Status',
        type: 'uint8',
      },
      { name: 'deposit', internalType: 'uint248', type: 'uint248' },
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      { name: 'answer', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [
      { name: '', internalType: 'contract IArbitrator', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitratorExtraData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'disputeIDToDisputeDetails',
    outputs: [
      { name: 'arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: 'requester', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_externalDisputeID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'externalIDtoLocalID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fundAppeal',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_contributor', internalType: 'address', type: 'address' },
    ],
    name: 'getContributionsToSuccessfulFundings',
    outputs: [
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'contributions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getDisputeFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getFundingStatus',
    outputs: [
      { name: 'raised', internalType: 'uint256', type: 'uint256' },
      { name: 'fullyFunded', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMultipliers',
    outputs: [
      { name: 'winner', internalType: 'uint256', type: 'uint256' },
      { name: 'loser', internalType: 'uint256', type: 'uint256' },
      { name: 'loserAppealPeriod', internalType: 'uint256', type: 'uint256' },
      { name: 'divisor', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getNumberOfRounds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundInfo',
    outputs: [
      { name: 'paidFees', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'feeRewards', internalType: 'uint256', type: 'uint256' },
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTotalWithdrawableAmount',
    outputs: [{ name: 'sum', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'handleFailedDisputeCreation',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'handleFailedDisputeCreationCustomParameters',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'homeProxy',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserAppealPeriodMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'messenger',
    outputs: [
      {
        name: '',
        internalType: 'contract ICrossDomainMessenger',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'numberOfRulingOptions',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_questionID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'questionIDToArbitrationID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationAcknowledgement',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationCancelation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'relayRule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'relayRuleCustomParameters',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'requestArbitration',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'requestArbitrationCustomParameters',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_disputeID', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_evidenceURI', internalType: 'string', type: 'string' },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wNative',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'winnerMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewards',
    outputs: [{ name: 'reward', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewardsForAllRounds',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const realitioForeignProxyBaseAddress = {
  1: '0x54811E1157CCc2BE68Ce4CC850e5ab3382fe627F',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const realitioForeignProxyBaseConfig = {
  address: realitioForeignProxyBaseAddress,
  abi: realitioForeignProxyBaseAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RealitioForeignProxyOptimism
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const realitioForeignProxyOptimismAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_wNative', internalType: 'address', type: 'address' },
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      { name: '_metaEvidence', internalType: 'string', type: 'string' },
      { name: '_winnerMultiplier', internalType: 'uint256', type: 'uint256' },
      { name: '_loserMultiplier', internalType: 'uint256', type: 'uint256' },
      {
        name: '_loserAppealPeriodMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: '_homeProxy', internalType: 'address', type: 'address' },
      { name: '_messenger', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ArbitrationCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ArbitrationFailed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_maxPrevious',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ArbitrationRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Contribution',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Dispute',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_party',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'Evidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MetaEvidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Ruling',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RulingFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: '_ruling',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'RulingRelayed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawal',
  },
  {
    type: 'function',
    inputs: [],
    name: 'META_EVIDENCE_ID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_GAS_LIMIT',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MULTIPLIER_DIVISOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'REFUSE_TO_ARBITRATE_REALITIO',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationCreatedBlock',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToDisputeExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationIDToRequester',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'arbitrationRequests',
    outputs: [
      {
        name: 'status',
        internalType: 'enum RealitioForeignProxyOptimism.Status',
        type: 'uint8',
      },
      { name: 'deposit', internalType: 'uint248', type: 'uint248' },
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      { name: 'answer', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [
      { name: '', internalType: 'contract IArbitrator', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitratorExtraData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'disputeIDToDisputeDetails',
    outputs: [
      { name: 'arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: 'requester', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_externalDisputeID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'externalIDtoLocalID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fundAppeal',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_contributor', internalType: 'address', type: 'address' },
    ],
    name: 'getContributionsToSuccessfulFundings',
    outputs: [
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'contributions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getDisputeFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getFundingStatus',
    outputs: [
      { name: 'raised', internalType: 'uint256', type: 'uint256' },
      { name: 'fullyFunded', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMultipliers',
    outputs: [
      { name: 'winner', internalType: 'uint256', type: 'uint256' },
      { name: 'loser', internalType: 'uint256', type: 'uint256' },
      { name: 'loserAppealPeriod', internalType: 'uint256', type: 'uint256' },
      { name: 'divisor', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getNumberOfRounds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundInfo',
    outputs: [
      { name: 'paidFees', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'feeRewards', internalType: 'uint256', type: 'uint256' },
      { name: 'fundedAnswers', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTotalWithdrawableAmount',
    outputs: [{ name: 'sum', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'handleFailedDisputeCreation',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'handleFailedDisputeCreationCustomParameters',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'homeProxy',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserAppealPeriodMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'loserMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'messenger',
    outputs: [
      {
        name: '',
        internalType: 'contract ICrossDomainMessenger',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'numberOfRulingOptions',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_questionID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'questionIDToArbitrationID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationAcknowledgement',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'receiveArbitrationCancelation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
    ],
    name: 'relayRule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requester', internalType: 'address', type: 'address' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'relayRuleCustomParameters',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'requestArbitration',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
      { name: '_gasLimit', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'requestArbitrationCustomParameters',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_disputeID', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      { name: '_evidenceURI', internalType: 'string', type: 'string' },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wNative',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'winnerMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_round', internalType: 'uint256', type: 'uint256' },
      { name: '_answer', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewards',
    outputs: [{ name: 'reward', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_arbitrationID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_contributedTo', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewardsForAllRounds',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const realitioForeignProxyOptimismAddress = {
  1: '0xd8b33e3F5426dB753D1C6c78b43d5151970cd928',
} as const

/**
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const realitioForeignProxyOptimismConfig = {
  address: realitioForeignProxyOptimismAddress,
  abi: realitioForeignProxyOptimismAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Realitio_v2_1_ArbitratorWithAppeals
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const realitioV2_1ArbitratorWithAppealsAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_realitio',
        internalType: 'contract IRealitio',
        type: 'address',
      },
      { name: '_metadata', internalType: 'string', type: 'string' },
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      { name: '_metaevidence', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Contribution',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Dispute',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_questionID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'DisputeIDToQuestionID',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_party',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'Evidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_metaEvidenceID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_evidence',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'MetaEvidence',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
        indexed: true,
      },
      {
        name: '_disputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Ruling',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'RulingFunded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_localDisputeID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_ruling',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawal',
  },
  {
    type: 'function',
    inputs: [],
    name: 'LOSER_APPEAL_PERIOD_MULTIPLIER',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'LOSER_STAKE_MULTIPLIER',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MULTIPLIER_DENOMINATOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WINNER_STAKE_MULTIPLIER',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationRequests',
    outputs: [
      {
        name: 'status',
        internalType: 'enum RealitioArbitratorWithAppealsBase.Status',
        type: 'uint8',
      },
      { name: 'requester', internalType: 'address', type: 'address' },
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      { name: 'ruling', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [
      { name: '', internalType: 'contract IArbitrator', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'arbitratorExtraData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'externalIDtoLocalID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fundAppeal',
    outputs: [{ name: 'fullyFunded', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getDisputeFee',
    outputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMultipliers',
    outputs: [
      {
        name: '_WINNER_STAKE_MULTIPLIER',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: '_LOSER_STAKE_MULTIPLIER',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: '_LOSER_APPEAL_PERIOD_MULTIPLIER',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: '_DENOMINATOR', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_contributor',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTotalWithdrawableAmount',
    outputs: [{ name: 'sum', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'metadata',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'numberOfRulingOptions',
    outputs: [{ name: 'count', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'realitio',
    outputs: [
      { name: '', internalType: 'contract IRealitio', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_lastHistoryHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: '_lastAnswerOrCommitmentID',
        internalType: 'bytes32',
        type: 'bytes32',
      },
      { name: '_lastAnswerer', internalType: 'address', type: 'address' },
    ],
    name: 'reportAnswer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_maxPrevious', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'requestArbitration',
    outputs: [{ name: 'disputeID', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_disputeID', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'uint256', type: 'uint256' },
      { name: '_evidenceURI', internalType: 'string', type: 'string' },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_contributor',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_roundNumber', internalType: 'uint256', type: 'uint256' },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewards',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_questionID', internalType: 'uint256', type: 'uint256' },
      {
        name: '_contributor',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_ruling', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewardsForAllRounds',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const realitioV2_1ArbitratorWithAppealsAddress = {
  1: '0x2018038203aEE8e7a29dABd73771b0355D4F85ad',
  11155111: '0xa638F22cDD13013494971b0e1325718AA45280dc',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const realitioV2_1ArbitratorWithAppealsConfig = {
  address: realitioV2_1ArbitratorWithAppealsAddress,
  abi: realitioV2_1ArbitratorWithAppealsAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"amb"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsAmb =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'amb',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsArbitrationRequests =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetDisputeFee =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetFundingStatus =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetMultipliers =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetRoundInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"homeChainId"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsHomeChainId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'homeChainId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsHomeProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsLoserMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"termsOfService"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsTermsOfService =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'termsOfService',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useReadRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsFundAppeal =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsRequestArbitration =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsSubmitEvidence =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsFundAppeal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsContributionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsDisputeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsRulingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const useWatchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBase =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseMetaEvidenceId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"MIN_GAS_LIMIT"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseMinGasLimit =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'MIN_GAS_LIMIT',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseMultiplierDivisor =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"REFUSE_TO_ARBITRATE_REALITIO"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseRefuseToArbitrateRealitio =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'REFUSE_TO_ARBITRATE_REALITIO',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationCreatedBlock"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitrationCreatedBlock =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationCreatedBlock',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitrationIdToDisputeExists =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitrationIdToRequester =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitrationRequests =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseArbitratorExtraData =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseDisputeIdToDisputeDetails =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseExternalIDtoLocalId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetDisputeFee =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetFundingStatus =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetMultipliers =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetNumberOfRounds =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetRoundInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseGetTotalWithdrawableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseHomeProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseLoserMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"messenger"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseMessenger =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'messenger',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseNumberOfRulingOptions =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseQuestionIdToArbitrationId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"wNative"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseWNative =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'wNative',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useReadRealitioForeignProxyBaseWinnerMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBase =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseFundAppeal =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseRelayRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseRelayRuleCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseRequestArbitration =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseRequestArbitrationCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseSubmitEvidence =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWriteRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBase =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseFundAppeal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseRelayRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseRelayRuleCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseRequestArbitration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseRequestArbitrationCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseSubmitEvidence =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseArbitrationCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseArbitrationCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseArbitrationFailedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseArbitrationRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseContributionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseDisputeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseMetaEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseRulingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseRulingFundedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"RulingRelayed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseRulingRelayedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'RulingRelayed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const useWatchRealitioForeignProxyBaseWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimism =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismMetaEvidenceId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"MIN_GAS_LIMIT"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismMinGasLimit =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'MIN_GAS_LIMIT',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismMultiplierDivisor =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"REFUSE_TO_ARBITRATE_REALITIO"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismRefuseToArbitrateRealitio =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'REFUSE_TO_ARBITRATE_REALITIO',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationCreatedBlock"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitrationCreatedBlock =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationCreatedBlock',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitrationIdToDisputeExists =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitrationIdToRequester =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitrationRequests =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismArbitratorExtraData =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismDisputeIdToDisputeDetails =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismExternalIDtoLocalId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetDisputeFee =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetFundingStatus =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetMultipliers =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetNumberOfRounds =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetRoundInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismGetTotalWithdrawableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismHomeProxy =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismLoserMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"messenger"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismMessenger =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'messenger',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismNumberOfRulingOptions =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismQuestionIdToArbitrationId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"wNative"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismWNative =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'wNative',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useReadRealitioForeignProxyOptimismWinnerMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimism =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismFundAppeal =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismRelayRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismRelayRuleCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismRequestArbitration =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismRequestArbitrationCustomParameters =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismSubmitEvidence =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimism =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismFundAppeal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismReceiveArbitrationCancelation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismRelayRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismRelayRuleCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismRequestArbitration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismSubmitEvidence =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismArbitrationCanceledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismArbitrationCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismArbitrationFailedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismArbitrationRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismContributionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismDisputeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismMetaEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismRulingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismRulingFundedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"RulingRelayed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismRulingRelayedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'RulingRelayed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const useWatchRealitioForeignProxyOptimismWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"LOSER_APPEAL_PERIOD_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'LOSER_APPEAL_PERIOD_MULTIPLIER',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"LOSER_STAKE_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'LOSER_STAKE_MULTIPLIER',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"MULTIPLIER_DENOMINATOR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsMultiplierDenominator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'MULTIPLIER_DENOMINATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"VERSION"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"WINNER_STAKE_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'WINNER_STAKE_MULTIPLIER',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsArbitrationRequests =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsArbitratorExtraData =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsGetDisputeFee =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsGetMultipliers =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"metadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsMetadata =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'metadata',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"realitio"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useReadRealitioV2_1ArbitratorWithAppealsRealitio =
  /*#__PURE__*/ createUseReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'realitio',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsFundAppeal =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"reportAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsReportAnswer =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'reportAnswer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsRequestArbitration =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsSubmitEvidence =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsFundAppeal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"reportAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsReportAnswer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'reportAnswer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsRequestArbitration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Contribution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsContributionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Dispute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsDisputeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"DisputeIDToQuestionID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'DisputeIDToQuestionID',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Evidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Ruling"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsRulingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const useWatchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Withdrawal',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsVersion =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"amb"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsAmb =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'amb',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetDisputeFee =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetFundingStatus =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetMultipliers =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetRoundInfo =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"homeChainId"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsHomeChainId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'homeChainId',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsHomeProxy =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsLoserMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"termsOfService"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsTermsOfService =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'termsOfService',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const readRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsFundAppeal =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsRequestArbitration =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsSubmitEvidence =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppeals =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsFundAppeal =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsContributionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsDisputeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsRulingEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignArbitrationProxyWithAppealsAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68)
 */
export const watchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignArbitrationProxyWithAppealsAbi,
    address: realitioForeignArbitrationProxyWithAppealsAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBase = /*#__PURE__*/ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseMetaEvidenceId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"MIN_GAS_LIMIT"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseMinGasLimit =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'MIN_GAS_LIMIT',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseMultiplierDivisor =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"REFUSE_TO_ARBITRATE_REALITIO"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseRefuseToArbitrateRealitio =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'REFUSE_TO_ARBITRATE_REALITIO',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseVersion =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationCreatedBlock"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitrationCreatedBlock =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationCreatedBlock',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitrationIdToDisputeExists =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitrationIdToRequester =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitrationRequests =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseArbitratorExtraData =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseDisputeIdToDisputeDetails =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseExternalIDtoLocalId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetDisputeFee =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetFundingStatus =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetMultipliers =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetNumberOfRounds =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetRoundInfo =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseGetTotalWithdrawableAmount =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseHomeProxy =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseLoserMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"messenger"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseMessenger =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'messenger',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseNumberOfRulingOptions =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseQuestionIdToArbitrationId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"wNative"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseWNative =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'wNative',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const readRealitioForeignProxyBaseWinnerMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBase = /*#__PURE__*/ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseFundAppeal =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseHandleFailedDisputeCreation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseReceiveArbitrationCancelation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseRelayRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseRelayRuleCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseRequestArbitration =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseRequestArbitrationCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseSubmitEvidence =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseWithdrawFeesAndRewards =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const writeRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBase =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseFundAppeal =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseHandleFailedDisputeCreation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseReceiveArbitrationCancelation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseRelayRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseRelayRuleCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseRequestArbitration =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseRequestArbitrationCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseSubmitEvidence =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseWithdrawFeesAndRewards =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const simulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseArbitrationCanceledEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseArbitrationCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseArbitrationFailedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseArbitrationRequestedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseContributionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseDisputeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseMetaEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseRulingEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseRulingFundedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"RulingRelayed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseRulingRelayedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'RulingRelayed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyBaseAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x54811e1157ccc2be68ce4cc850e5ab3382fe627f)
 */
export const watchRealitioForeignProxyBaseWithdrawalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyBaseAbi,
    address: realitioForeignProxyBaseAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimism =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"META_EVIDENCE_ID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismMetaEvidenceId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'META_EVIDENCE_ID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"MIN_GAS_LIMIT"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismMinGasLimit =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'MIN_GAS_LIMIT',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismMultiplierDivisor =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"NUMBER_OF_CHOICES_FOR_ARBITRATOR"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismNumberOfChoicesForArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'NUMBER_OF_CHOICES_FOR_ARBITRATOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"REFUSE_TO_ARBITRATE_REALITIO"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismRefuseToArbitrateRealitio =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'REFUSE_TO_ARBITRATE_REALITIO',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"VERSION"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismVersion =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationCreatedBlock"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitrationCreatedBlock =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationCreatedBlock',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationIDToDisputeExists"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitrationIdToDisputeExists =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationIDToDisputeExists',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationIDToRequester"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitrationIdToRequester =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationIDToRequester',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitrationRequests =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitrator"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismArbitratorExtraData =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"disputeIDToDisputeDetails"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismDisputeIdToDisputeDetails =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'disputeIDToDisputeDetails',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismExternalIDtoLocalId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getContributionsToSuccessfulFundings"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getContributionsToSuccessfulFundings',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetDisputeFee =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getFundingStatus"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetFundingStatus =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getFundingStatus',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetMultipliers =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getNumberOfRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetNumberOfRounds =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getNumberOfRounds',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetRoundInfo =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismGetTotalWithdrawableAmount =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"homeProxy"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismHomeProxy =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'homeProxy',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"loserAppealPeriodMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'loserAppealPeriodMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"loserMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismLoserMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'loserMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"messenger"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismMessenger =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'messenger',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismNumberOfRulingOptions =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"questionIDToArbitrationID"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismQuestionIdToArbitrationId =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'questionIDToArbitrationID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"wNative"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismWNative =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'wNative',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"winnerMultiplier"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const readRealitioForeignProxyOptimismWinnerMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'winnerMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimism =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismFundAppeal =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismHandleFailedDisputeCreation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismReceiveArbitrationCancelation =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismRelayRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismRelayRuleCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismRequestArbitration =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismRequestArbitrationCustomParameters =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismSubmitEvidence =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismWithdrawFeesAndRewards =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const writeRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createWriteContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimism =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismFundAppeal =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismHandleFailedDisputeCreation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"handleFailedDisputeCreationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'handleFailedDisputeCreationCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationAcknowledgement"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationAcknowledgement',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"receiveArbitrationCancelation"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismReceiveArbitrationCancelation =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'receiveArbitrationCancelation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismRelayRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"relayRuleCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismRelayRuleCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'relayRuleCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismRequestArbitration =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"requestArbitrationCustomParameters"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'requestArbitrationCustomParameters',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"rule"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismSubmitEvidence =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismWithdrawFeesAndRewards =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const simulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationCanceled"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismArbitrationCanceledEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationCanceled',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationCreated"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismArbitrationCreatedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationCreated',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationFailed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismArbitrationFailedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationFailed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"ArbitrationRequested"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismArbitrationRequestedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'ArbitrationRequested',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Contribution"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismContributionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Dispute"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismDisputeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Evidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismMetaEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Ruling"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismRulingEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismRulingFundedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"RulingRelayed"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismRulingRelayedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'RulingRelayed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioForeignProxyOptimismAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xd8b33e3f5426db753d1c6c78b43d5151970cd928)
 */
export const watchRealitioForeignProxyOptimismWithdrawalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioForeignProxyOptimismAbi,
    address: realitioForeignProxyOptimismAddress,
    eventName: 'Withdrawal',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"LOSER_APPEAL_PERIOD_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'LOSER_APPEAL_PERIOD_MULTIPLIER',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"LOSER_STAKE_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'LOSER_STAKE_MULTIPLIER',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"MULTIPLIER_DENOMINATOR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsMultiplierDenominator =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'MULTIPLIER_DENOMINATOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"VERSION"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsVersion =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'VERSION',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"WINNER_STAKE_MULTIPLIER"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'WINNER_STAKE_MULTIPLIER',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitrationRequests"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsArbitrationRequests =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitrationRequests',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"externalIDtoLocalID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'externalIDtoLocalID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getDisputeFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsGetDisputeFee =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getDisputeFee',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getMultipliers"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsGetMultipliers =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getMultipliers',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"getTotalWithdrawableAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'getTotalWithdrawableAmount',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"metadata"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsMetadata =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'metadata',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"numberOfRulingOptions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'numberOfRulingOptions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"realitio"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const readRealitioV2_1ArbitratorWithAppealsRealitio =
  /*#__PURE__*/ createReadContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'realitio',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsFundAppeal =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"reportAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsReportAnswer =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'reportAnswer',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsRequestArbitration =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsRule =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsSubmitEvidence =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createWriteContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppeals =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsFundAppeal =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"reportAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsReportAnswer =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'reportAnswer',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"requestArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsRequestArbitration =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'requestArbitration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsRule =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `functionName` set to `"withdrawFeesAndRewardsForAllRounds"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds =
  /*#__PURE__*/ createSimulateContract({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    functionName: 'withdrawFeesAndRewardsForAllRounds',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Contribution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsContributionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Dispute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsDisputeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"DisputeIDToQuestionID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'DisputeIDToQuestionID',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Evidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Ruling"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsRulingEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Ruling',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"RulingFunded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'RulingFunded',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realitioV2_1ArbitratorWithAppealsAbi}__ and `eventName` set to `"Withdrawal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x2018038203aEE8e7a29dABd73771b0355D4F85ad)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xa638F22cDD13013494971b0e1325718AA45280dc)
 */
export const watchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realitioV2_1ArbitratorWithAppealsAbi,
    address: realitioV2_1ArbitratorWithAppealsAddress,
    eventName: 'Withdrawal',
  })
