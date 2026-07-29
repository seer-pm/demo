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
// LightGeneralizedTCR
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const lightGeneralizedTcrAbi = [
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_connectedTCR',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ConnectedTCRSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_itemID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_requestID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_roundID',
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
        name: '_contribution',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_side',
        internalType: 'enum LightGeneralizedTCR.Party',
        type: 'uint8',
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
        name: '_itemID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_updatedDirectly',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'ItemStatusChange',
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
        name: '_itemID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: '_data', internalType: 'string', type: 'string', indexed: false },
      {
        name: '_addedDirectly',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'NewItem',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_itemID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_evidenceGroupID',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RequestSubmitted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_beneficiary',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_itemID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_request',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_round',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardWithdrawn',
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
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'MULTIPLIER_DIVISOR',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'RULING_OPTIONS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: true,
    type: 'function',
    inputs: [{ name: '_item', internalType: 'string', type: 'string' }],
    name: 'addItem',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [{ name: '_item', internalType: 'string', type: 'string' }],
    name: 'addItemDirectly',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'arbitrationParamsChanges',
    outputs: [
      {
        name: 'arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: 'arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'arbitrator',
    outputs: [
      { name: '', internalType: 'contract IArbitrator', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'arbitratorDisputeIDToItemID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'arbitratorExtraData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'challengePeriodDuration',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: true,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_evidence', internalType: 'string', type: 'string' },
    ],
    name: 'challengeRequest',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      {
        name: '_registrationMetaEvidence',
        internalType: 'string',
        type: 'string',
      },
      { name: '_clearingMetaEvidence', internalType: 'string', type: 'string' },
    ],
    name: 'changeArbitrationParams',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_challengePeriodDuration',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeChallengePeriodDuration',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_connectedTCR', internalType: 'address', type: 'address' },
    ],
    name: 'changeConnectedTCR',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [{ name: '_governor', internalType: 'address', type: 'address' }],
    name: 'changeGovernor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_loserStakeMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeLoserStakeMultiplier',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_relayerContract', internalType: 'address', type: 'address' },
    ],
    name: 'changeRelayerContract',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_removalBaseDeposit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'changeRemovalBaseDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_removalChallengeBaseDeposit',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeRemovalChallengeBaseDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_sharedStakeMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeSharedStakeMultiplier',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_submissionBaseDeposit',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeSubmissionBaseDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_submissionChallengeBaseDeposit',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeSubmissionChallengeBaseDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_winnerStakeMultiplier',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'changeWinnerStakeMultiplier',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [{ name: '_itemID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'executeRequest',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: false,
    payable: true,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      {
        name: '_side',
        internalType: 'enum LightGeneralizedTCR.Party',
        type: 'uint8',
      },
    ],
    name: 'fundAppeal',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requestID', internalType: 'uint256', type: 'uint256' },
      { name: '_roundID', internalType: 'uint256', type: 'uint256' },
      { name: '_contributor', internalType: 'address', type: 'address' },
    ],
    name: 'getContributions',
    outputs: [
      { name: 'contributions', internalType: 'uint256[3]', type: 'uint256[3]' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requestID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getEvidenceGroupID',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [{ name: '_itemID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getItemInfo',
    outputs: [
      {
        name: 'status',
        internalType: 'enum LightGeneralizedTCR.Status',
        type: 'uint8',
      },
      { name: 'numberOfRequests', internalType: 'uint256', type: 'uint256' },
      { name: 'sumDeposit', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requestID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRequestInfo',
    outputs: [
      { name: 'disputed', internalType: 'bool', type: 'bool' },
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      { name: 'submissionTime', internalType: 'uint256', type: 'uint256' },
      { name: 'resolved', internalType: 'bool', type: 'bool' },
      {
        name: 'parties',
        internalType: 'address payable[3]',
        type: 'address[3]',
      },
      { name: 'numberOfRounds', internalType: 'uint256', type: 'uint256' },
      {
        name: 'ruling',
        internalType: 'enum LightGeneralizedTCR.Party',
        type: 'uint8',
      },
      {
        name: 'requestArbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      {
        name: 'requestArbitratorExtraData',
        internalType: 'bytes',
        type: 'bytes',
      },
      { name: 'metaEvidenceID', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requestID', internalType: 'uint256', type: 'uint256' },
      { name: '_roundID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRoundInfo',
    outputs: [
      { name: 'appealed', internalType: 'bool', type: 'bool' },
      { name: 'amountPaid', internalType: 'uint256[3]', type: 'uint256[3]' },
      { name: 'hasPaid', internalType: 'bool[3]', type: 'bool[3]' },
      { name: 'feeRewards', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'governor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_arbitrator',
        internalType: 'contract IArbitrator',
        type: 'address',
      },
      { name: '_arbitratorExtraData', internalType: 'bytes', type: 'bytes' },
      { name: '_connectedTCR', internalType: 'address', type: 'address' },
      {
        name: '_registrationMetaEvidence',
        internalType: 'string',
        type: 'string',
      },
      { name: '_clearingMetaEvidence', internalType: 'string', type: 'string' },
      { name: '_governor', internalType: 'address', type: 'address' },
      { name: '_baseDeposits', internalType: 'uint256[4]', type: 'uint256[4]' },
      {
        name: '_challengePeriodDuration',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: '_stakeMultipliers',
        internalType: 'uint256[3]',
        type: 'uint256[3]',
      },
      { name: '_relayerContract', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'items',
    outputs: [
      {
        name: 'status',
        internalType: 'enum LightGeneralizedTCR.Status',
        type: 'uint8',
      },
      { name: 'sumDeposit', internalType: 'uint128', type: 'uint128' },
      { name: 'requestCount', internalType: 'uint120', type: 'uint120' },
    ],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'loserStakeMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'metaEvidenceUpdates',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'relayerContract',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'removalBaseDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'removalChallengeBaseDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: true,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_evidence', internalType: 'string', type: 'string' },
    ],
    name: 'removeItem',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [{ name: '_itemID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'removeItemDirectly',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [
      { name: '', internalType: 'bytes32', type: 'bytes32' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'requestsDisputeData',
    outputs: [
      { name: 'disputeID', internalType: 'uint256', type: 'uint256' },
      {
        name: 'status',
        internalType: 'enum LightGeneralizedTCR.DisputeStatus',
        type: 'uint8',
      },
      {
        name: 'ruling',
        internalType: 'enum LightGeneralizedTCR.Party',
        type: 'uint8',
      },
      { name: 'roundCount', internalType: 'uint240', type: 'uint240' },
    ],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: false,
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
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'sharedStakeMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'submissionBaseDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'submissionChallengeBaseDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_evidence', internalType: 'string', type: 'string' },
    ],
    name: 'submitEvidence',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    constant: true,
    payable: false,
    type: 'function',
    inputs: [],
    name: 'winnerStakeMultiplier',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    constant: false,
    payable: false,
    type: 'function',
    inputs: [
      {
        name: '_beneficiary',
        internalType: 'address payable',
        type: 'address',
      },
      { name: '_itemID', internalType: 'bytes32', type: 'bytes32' },
      { name: '_requestID', internalType: 'uint256', type: 'uint256' },
      { name: '_roundID', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawFeesAndRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const lightGeneralizedTcrAddress = {
  1: '0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA',
  10: '0x0000000000000000000000000000000000000000',
  100: '0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672',
  8453: '0x0000000000000000000000000000000000000000',
  11155111: '0x06140fb869486363818196B61704493a8790F73C',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const lightGeneralizedTcrConfig = {
  address: lightGeneralizedTcrAddress,
  abi: lightGeneralizedTcrAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcr = /*#__PURE__*/ createUseReadContract({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrMultiplierDivisor =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"RULING_OPTIONS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrRulingOptions =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'RULING_OPTIONS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitrationParamsChanges"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrArbitrationParamsChanges =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitrationParamsChanges',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrArbitrator =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitratorDisputeIDToItemID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrArbitratorDisputeIdToItemId =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitratorDisputeIDToItemID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrArbitratorExtraData =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrChallengePeriodDuration =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengePeriodDuration',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getContributions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGetContributions =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getContributions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getEvidenceGroupID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGetEvidenceGroupId =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getEvidenceGroupID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getItemInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGetItemInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getItemInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getRequestInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGetRequestInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getRequestInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGetRoundInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrGovernor =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'governor',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"items"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrItems =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'items',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"loserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrLoserStakeMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'loserStakeMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"metaEvidenceUpdates"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrMetaEvidenceUpdates =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'metaEvidenceUpdates',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"relayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrRelayerContract =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'relayerContract',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrRemovalBaseDeposit =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removalBaseDeposit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"requestsDisputeData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrRequestsDisputeData =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'requestsDisputeData',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"sharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrSharedStakeMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'sharedStakeMultiplier',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrSubmissionBaseDeposit =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submissionBaseDeposit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"winnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useReadLightGeneralizedTcrWinnerStakeMultiplier =
  /*#__PURE__*/ createUseReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'winnerStakeMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcr = /*#__PURE__*/ createUseWriteContract(
  { abi: lightGeneralizedTcrAbi, address: lightGeneralizedTcrAddress },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrAddItem =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItem',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrAddItemDirectly =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItemDirectly',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChallengeRequest =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengeRequest',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeArbitrationParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeArbitrationParams =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeArbitrationParams',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeChallengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeChallengePeriodDuration =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeChallengePeriodDuration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeConnectedTCR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeConnectedTcr =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeConnectedTCR',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeGovernor =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeLoserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeLoserStakeMultiplier =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeLoserStakeMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRelayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeRelayerContract =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRelayerContract',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeRemovalBaseDeposit =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalBaseDeposit',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeSharedStakeMultiplier =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSharedStakeMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeSubmissionBaseDeposit =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionBaseDeposit',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeWinnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrChangeWinnerStakeMultiplier =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeWinnerStakeMultiplier',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"executeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrExecuteRequest =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'executeRequest',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrFundAppeal =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrRemoveItem =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItem',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrRemoveItemDirectly =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItemDirectly',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrRule =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrSubmitEvidence =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWriteLightGeneralizedTcrWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcr =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrAddItem =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItem',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrAddItemDirectly =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItemDirectly',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChallengeRequest =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengeRequest',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeArbitrationParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeArbitrationParams =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeArbitrationParams',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeChallengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeChallengePeriodDuration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeChallengePeriodDuration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeConnectedTCR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeConnectedTcr =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeConnectedTCR',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeGovernor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeLoserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeLoserStakeMultiplier =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeLoserStakeMultiplier',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRelayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeRelayerContract =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRelayerContract',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeRemovalBaseDeposit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalBaseDeposit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeSharedStakeMultiplier =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSharedStakeMultiplier',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeSubmissionBaseDeposit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionBaseDeposit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeWinnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrChangeWinnerStakeMultiplier =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeWinnerStakeMultiplier',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"executeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrExecuteRequest =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'executeRequest',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrFundAppeal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrRemoveItem =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItem',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrRemoveItemDirectly =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItemDirectly',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrRule =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrSubmitEvidence =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useSimulateLightGeneralizedTcrWithdrawFeesAndRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"ConnectedTCRSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrConnectedTcrSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'ConnectedTCRSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Contribution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrContributionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Dispute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrDisputeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Evidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"ItemStatusChange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrItemStatusChangeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'ItemStatusChange',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrMetaEvidenceEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"NewItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrNewItemEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'NewItem',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"RequestSubmitted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrRequestSubmittedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'RequestSubmitted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"RewardWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrRewardWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'RewardWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Ruling"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const useWatchLightGeneralizedTcrRulingEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Ruling',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcr = /*#__PURE__*/ createReadContract({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"MULTIPLIER_DIVISOR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrMultiplierDivisor =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'MULTIPLIER_DIVISOR',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"RULING_OPTIONS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrRulingOptions =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'RULING_OPTIONS',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitrationParamsChanges"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrArbitrationParamsChanges =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitrationParamsChanges',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrArbitrator =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitrator',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitratorDisputeIDToItemID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrArbitratorDisputeIdToItemId =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitratorDisputeIDToItemID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"arbitratorExtraData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrArbitratorExtraData =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'arbitratorExtraData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrChallengePeriodDuration =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengePeriodDuration',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getContributions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGetContributions =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getContributions',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getEvidenceGroupID"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGetEvidenceGroupId =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getEvidenceGroupID',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getItemInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGetItemInfo =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getItemInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getRequestInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGetRequestInfo =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getRequestInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"getRoundInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGetRoundInfo =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'getRoundInfo',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"governor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrGovernor = /*#__PURE__*/ createReadContract(
  {
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'governor',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"items"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrItems = /*#__PURE__*/ createReadContract({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: 'items',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"loserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrLoserStakeMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'loserStakeMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"metaEvidenceUpdates"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrMetaEvidenceUpdates =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'metaEvidenceUpdates',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"relayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrRelayerContract =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'relayerContract',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrRemovalBaseDeposit =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removalBaseDeposit',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"requestsDisputeData"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrRequestsDisputeData =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'requestsDisputeData',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"sharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrSharedStakeMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'sharedStakeMultiplier',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrSubmissionBaseDeposit =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submissionBaseDeposit',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"winnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const readLightGeneralizedTcrWinnerStakeMultiplier =
  /*#__PURE__*/ createReadContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'winnerStakeMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcr = /*#__PURE__*/ createWriteContract({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrAddItem =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItem',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrAddItemDirectly =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItemDirectly',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChallengeRequest =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengeRequest',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeArbitrationParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeArbitrationParams =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeArbitrationParams',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeChallengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeChallengePeriodDuration =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeChallengePeriodDuration',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeConnectedTCR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeConnectedTcr =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeConnectedTCR',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeGovernor =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeLoserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeLoserStakeMultiplier =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeLoserStakeMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRelayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeRelayerContract =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRelayerContract',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeRemovalBaseDeposit =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalBaseDeposit',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeSharedStakeMultiplier =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSharedStakeMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeSubmissionBaseDeposit =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionBaseDeposit',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeWinnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrChangeWinnerStakeMultiplier =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeWinnerStakeMultiplier',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"executeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrExecuteRequest =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'executeRequest',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrFundAppeal =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrInitialize =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrRemoveItem =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItem',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrRemoveItemDirectly =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItemDirectly',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrRule = /*#__PURE__*/ createWriteContract({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: 'rule',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrSubmitEvidence =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const writeLightGeneralizedTcrWithdrawFeesAndRewards =
  /*#__PURE__*/ createWriteContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcr = /*#__PURE__*/ createSimulateContract(
  { abi: lightGeneralizedTcrAbi, address: lightGeneralizedTcrAddress },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrAddItem =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItem',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"addItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrAddItemDirectly =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'addItemDirectly',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"challengeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChallengeRequest =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'challengeRequest',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeArbitrationParams"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeArbitrationParams =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeArbitrationParams',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeChallengePeriodDuration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeChallengePeriodDuration =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeChallengePeriodDuration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeConnectedTCR"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeConnectedTcr =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeConnectedTCR',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeGovernor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeGovernor =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeGovernor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeLoserStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeLoserStakeMultiplier =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeLoserStakeMultiplier',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRelayerContract"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeRelayerContract =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRelayerContract',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeRemovalBaseDeposit =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalBaseDeposit',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeRemovalChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeRemovalChallengeBaseDeposit',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSharedStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeSharedStakeMultiplier =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSharedStakeMultiplier',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeSubmissionBaseDeposit =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionBaseDeposit',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeSubmissionChallengeBaseDeposit"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeSubmissionChallengeBaseDeposit',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"changeWinnerStakeMultiplier"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrChangeWinnerStakeMultiplier =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'changeWinnerStakeMultiplier',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"executeRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrExecuteRequest =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'executeRequest',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"fundAppeal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrFundAppeal =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'fundAppeal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"initialize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrInitialize =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrRemoveItem =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItem',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"removeItemDirectly"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrRemoveItemDirectly =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'removeItemDirectly',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"rule"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrRule =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'rule',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"submitEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrSubmitEvidence =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'submitEvidence',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `functionName` set to `"withdrawFeesAndRewards"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const simulateLightGeneralizedTcrWithdrawFeesAndRewards =
  /*#__PURE__*/ createSimulateContract({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: 'withdrawFeesAndRewards',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"ConnectedTCRSet"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrConnectedTcrSetEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'ConnectedTCRSet',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Contribution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrContributionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Contribution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Dispute"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrDisputeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Dispute',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Evidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Evidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"ItemStatusChange"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrItemStatusChangeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'ItemStatusChange',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"MetaEvidence"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrMetaEvidenceEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'MetaEvidence',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"NewItem"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrNewItemEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'NewItem',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"RequestSubmitted"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrRequestSubmittedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'RequestSubmitted',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"RewardWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrRewardWithdrawnEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'RewardWithdrawn',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link lightGeneralizedTcrAbi}__ and `eventName` set to `"Ruling"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000000000000000000000000000000000000)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x06140fb869486363818196B61704493a8790F73C)
 */
export const watchLightGeneralizedTcrRulingEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    eventName: 'Ruling',
  })
