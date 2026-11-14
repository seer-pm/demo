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
// Reality
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const realityAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'answer_hash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'answer',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'nonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'bond',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogAnswerReveal',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'LogCancelArbitration',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogClaim',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'answer',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'LogFinalize',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'bounty_added',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'bounty',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'LogFundAnswerBounty',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'min_bond',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogMinimumBond',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'answer',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'history_hash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'bond',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'ts', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'is_commitment',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'LogNewAnswer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'template_id',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'question',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'content_hash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'arbitrator',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'timeout',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'opening_ts',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'nonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'created',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogNewQuestion',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'template_id',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'question_text',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'LogNewTemplate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'LogNotifyOfArbitrationRequest',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'reopened_question_id',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'LogReopenQuestion',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'arbitrator',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogSetQuestionFee',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LogWithdraw',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'arbitrator_question_fees',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'template_id', internalType: 'uint256', type: 'uint256' },
      { name: 'question', internalType: 'string', type: 'string' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'askQuestion',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'template_id', internalType: 'uint256', type: 'uint256' },
      { name: 'question', internalType: 'string', type: 'string' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'askQuestionWithMinBond',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'payee_if_wrong', internalType: 'address', type: 'address' },
      { name: 'last_history_hash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'last_answer_or_commitment_id',
        internalType: 'bytes32',
        type: 'bytes32',
      },
      { name: 'last_answerer', internalType: 'address', type: 'address' },
    ],
    name: 'assignWinnerAndSubmitAnswerByArbitrator',
    outputs: [],
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
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'cancelArbitration',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_ids', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'lengths', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'hist_hashes', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'addrs', internalType: 'address[]', type: 'address[]' },
      { name: 'bonds', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'answers', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claimMultipleAndWithdrawBalance',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'history_hashes', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'addrs', internalType: 'address[]', type: 'address[]' },
      { name: 'bonds', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'answers', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'commitments',
    outputs: [
      { name: 'reveal_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'is_revealed', internalType: 'bool', type: 'bool' },
      { name: 'revealed_answer', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'content', internalType: 'string', type: 'string' }],
    name: 'createTemplate',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'content', internalType: 'string', type: 'string' },
      { name: 'question', internalType: 'string', type: 'string' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createTemplateAndAskQuestion',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'fundAnswerBounty',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getArbitrator',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getBestAnswer',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getBond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getBounty',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getContentHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getFinalAnswer',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'content_hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'min_timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getFinalAnswerIfMatches',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getFinalizeTS',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getHistoryHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getMinBond',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getOpeningTS',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getTimeout',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'isFinalized',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'isPendingArbitration',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'isSettledTooSoon',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'requester', internalType: 'address', type: 'address' },
      { name: 'max_previous', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'notifyOfArbitrationRequest',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'question_claims',
    outputs: [
      { name: 'payee', internalType: 'address', type: 'address' },
      { name: 'last_bond', internalType: 'uint256', type: 'uint256' },
      { name: 'queued_funds', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'questions',
    outputs: [
      { name: 'content_hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'finalize_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'is_pending_arbitration', internalType: 'bool', type: 'bool' },
      { name: 'bounty', internalType: 'uint256', type: 'uint256' },
      { name: 'best_answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'history_hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'bond', internalType: 'uint256', type: 'uint256' },
      { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'template_id', internalType: 'uint256', type: 'uint256' },
      { name: 'question', internalType: 'string', type: 'string' },
      { name: 'arbitrator', internalType: 'address', type: 'address' },
      { name: 'timeout', internalType: 'uint32', type: 'uint32' },
      { name: 'opening_ts', internalType: 'uint32', type: 'uint32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'min_bond', internalType: 'uint256', type: 'uint256' },
      { name: 'reopens_question_id', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'reopenQuestion',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'reopened_questions',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'reopener_questions',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resultFor',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'question_id', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resultForOnceSettled',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'fee', internalType: 'uint256', type: 'uint256' }],
    name: 'setQuestionFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'max_previous', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'submitAnswer',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answerer', internalType: 'address', type: 'address' },
    ],
    name: 'submitAnswerByArbitrator',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer_hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'max_previous', internalType: 'uint256', type: 'uint256' },
      { name: '_answerer', internalType: 'address', type: 'address' },
    ],
    name: 'submitAnswerCommitment',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'max_previous', internalType: 'uint256', type: 'uint256' },
      { name: 'answerer', internalType: 'address', type: 'address' },
    ],
    name: 'submitAnswerFor',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'question_id', internalType: 'bytes32', type: 'bytes32' },
      { name: 'answer', internalType: 'bytes32', type: 'bytes32' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'bond', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'submitAnswerReveal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'template_hashes',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'templates',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const realityAddress = {
  1: '0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c',
  10: '0x0eF940F7f053a2eF5D6578841072488aF0c7d89A',
  100: '0xE78996A233895bE74a66F451f1019cA9734205cc',
  8453: '0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8',
  11155111: '0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const realityConfig = {
  address: realityAddress,
  abi: realityAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadReality = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"arbitrator_question_fees"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityArbitratorQuestionFees =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'arbitrator_question_fees',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"commitments"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityCommitments = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'commitments',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetArbitrator = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getArbitrator',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBestAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetBestAnswer = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBestAnswer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetBond = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBond',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetBounty = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBounty',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getContentHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetContentHash = /*#__PURE__*/ createUseReadContract(
  { abi: realityAbi, address: realityAddress, functionName: 'getContentHash' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetFinalAnswer = /*#__PURE__*/ createUseReadContract(
  { abi: realityAbi, address: realityAddress, functionName: 'getFinalAnswer' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalAnswerIfMatches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetFinalAnswerIfMatches =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'getFinalAnswerIfMatches',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalizeTS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetFinalizeTs = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getFinalizeTS',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getHistoryHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetHistoryHash = /*#__PURE__*/ createUseReadContract(
  { abi: realityAbi, address: realityAddress, functionName: 'getHistoryHash' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetMinBond = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getMinBond',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getOpeningTS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetOpeningTs = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getOpeningTS',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getTimeout"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityGetTimeout = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getTimeout',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isFinalized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityIsFinalized = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'isFinalized',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isPendingArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityIsPendingArbitration =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'isPendingArbitration',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isSettledTooSoon"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityIsSettledTooSoon =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'isSettledTooSoon',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"question_claims"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityQuestionClaims = /*#__PURE__*/ createUseReadContract(
  { abi: realityAbi, address: realityAddress, functionName: 'question_claims' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityQuestions = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'questions',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopened_questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityReopenedQuestions =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'reopened_questions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopener_questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityReopenerQuestions =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'reopener_questions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"resultFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityResultFor = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'resultFor',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"resultForOnceSettled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityResultForOnceSettled =
  /*#__PURE__*/ createUseReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'resultForOnceSettled',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"template_hashes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityTemplateHashes = /*#__PURE__*/ createUseReadContract(
  { abi: realityAbi, address: realityAddress, functionName: 'template_hashes' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"templates"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useReadRealityTemplates = /*#__PURE__*/ createUseReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'templates',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteReality = /*#__PURE__*/ createUseWriteContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityAskQuestion = /*#__PURE__*/ createUseWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'askQuestion',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestionWithMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityAskQuestionWithMinBond =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'askQuestionWithMinBond',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"assignWinnerAndSubmitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityAssignWinnerAndSubmitAnswerByArbitrator =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'assignWinnerAndSubmitAnswerByArbitrator',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"cancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityCancelArbitration =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'cancelArbitration',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimMultipleAndWithdrawBalance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityClaimMultipleAndWithdrawBalance =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimMultipleAndWithdrawBalance',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimWinnings"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityClaimWinnings =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimWinnings',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityCreateTemplate =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplateAndAskQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityCreateTemplateAndAskQuestion =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplateAndAskQuestion',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"fundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityFundAnswerBounty =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'fundAnswerBounty',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"notifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityNotifyOfArbitrationRequest =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'notifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityReopenQuestion =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'reopenQuestion',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"setQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySetQuestionFee =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'setQuestionFee',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySubmitAnswer = /*#__PURE__*/ createUseWriteContract(
  { abi: realityAbi, address: realityAddress, functionName: 'submitAnswer' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySubmitAnswerByArbitrator =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerByArbitrator',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySubmitAnswerCommitment =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerCommitment',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySubmitAnswerFor =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerFor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealitySubmitAnswerReveal =
  /*#__PURE__*/ createUseWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerReveal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWriteRealityWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateReality = /*#__PURE__*/ createUseSimulateContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityAskQuestion =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'askQuestion',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestionWithMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityAskQuestionWithMinBond =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'askQuestionWithMinBond',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"assignWinnerAndSubmitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityAssignWinnerAndSubmitAnswerByArbitrator =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'assignWinnerAndSubmitAnswerByArbitrator',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"cancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityCancelArbitration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'cancelArbitration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimMultipleAndWithdrawBalance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityClaimMultipleAndWithdrawBalance =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimMultipleAndWithdrawBalance',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimWinnings"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityClaimWinnings =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimWinnings',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityCreateTemplate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplateAndAskQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityCreateTemplateAndAskQuestion =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplateAndAskQuestion',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"fundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityFundAnswerBounty =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'fundAnswerBounty',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"notifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityNotifyOfArbitrationRequest =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'notifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityReopenQuestion =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'reopenQuestion',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"setQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySetQuestionFee =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'setQuestionFee',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySubmitAnswer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySubmitAnswerByArbitrator =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerByArbitrator',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySubmitAnswerCommitment =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerCommitment',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySubmitAnswerFor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerFor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealitySubmitAnswerReveal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerReveal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useSimulateRealityWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogAnswerRevealEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogAnswerReveal',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogCancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogCancelArbitrationEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogCancelArbitration',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogClaimEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogClaim',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogFinalize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogFinalizeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogFinalize',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogFundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogFundAnswerBountyEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogFundAnswerBounty',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogMinimumBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogMinimumBondEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogMinimumBond',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogNewAnswerEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewAnswer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogNewQuestionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewQuestion',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogNewTemplateEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewTemplate',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNotifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogNotifyOfArbitrationRequestEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNotifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogReopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogReopenQuestionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogReopenQuestion',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogSetQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogSetQuestionFeeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogSetQuestionFee',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogWithdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const useWatchRealityLogWithdrawEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogWithdraw',
  })

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readReality = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"arbitrator_question_fees"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityArbitratorQuestionFees =
  /*#__PURE__*/ createReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'arbitrator_question_fees',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityBalanceOf = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"commitments"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityCommitments = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'commitments',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetArbitrator = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getArbitrator',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBestAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetBestAnswer = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBestAnswer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetBond = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBond',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetBounty = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getBounty',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getContentHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetContentHash = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getContentHash',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetFinalAnswer = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getFinalAnswer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalAnswerIfMatches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetFinalAnswerIfMatches =
  /*#__PURE__*/ createReadContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'getFinalAnswerIfMatches',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getFinalizeTS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetFinalizeTs = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getFinalizeTS',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getHistoryHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetHistoryHash = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getHistoryHash',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetMinBond = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getMinBond',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getOpeningTS"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetOpeningTs = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getOpeningTS',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"getTimeout"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityGetTimeout = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'getTimeout',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isFinalized"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityIsFinalized = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'isFinalized',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isPendingArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityIsPendingArbitration = /*#__PURE__*/ createReadContract(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: 'isPendingArbitration',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"isSettledTooSoon"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityIsSettledTooSoon = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'isSettledTooSoon',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"question_claims"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityQuestionClaims = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'question_claims',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityQuestions = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'questions',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopened_questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityReopenedQuestions = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'reopened_questions',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopener_questions"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityReopenerQuestions = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'reopener_questions',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"resultFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityResultFor = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'resultFor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"resultForOnceSettled"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityResultForOnceSettled = /*#__PURE__*/ createReadContract(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: 'resultForOnceSettled',
  },
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"template_hashes"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityTemplateHashes = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'template_hashes',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"templates"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const readRealityTemplates = /*#__PURE__*/ createReadContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'templates',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeReality = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityAskQuestion = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'askQuestion',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestionWithMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityAskQuestionWithMinBond =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'askQuestionWithMinBond',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"assignWinnerAndSubmitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityAssignWinnerAndSubmitAnswerByArbitrator =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'assignWinnerAndSubmitAnswerByArbitrator',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"cancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityCancelArbitration = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'cancelArbitration',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimMultipleAndWithdrawBalance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityClaimMultipleAndWithdrawBalance =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimMultipleAndWithdrawBalance',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimWinnings"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityClaimWinnings = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'claimWinnings',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityCreateTemplate = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'createTemplate',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplateAndAskQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityCreateTemplateAndAskQuestion =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplateAndAskQuestion',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"fundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityFundAnswerBounty = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'fundAnswerBounty',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"notifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityNotifyOfArbitrationRequest =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'notifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityReopenQuestion = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'reopenQuestion',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"setQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySetQuestionFee = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'setQuestionFee',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySubmitAnswer = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'submitAnswer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySubmitAnswerByArbitrator =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerByArbitrator',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySubmitAnswerCommitment =
  /*#__PURE__*/ createWriteContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerCommitment',
  })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySubmitAnswerFor = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'submitAnswerFor',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealitySubmitAnswerReveal = /*#__PURE__*/ createWriteContract(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerReveal',
  },
)

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const writeRealityWithdraw = /*#__PURE__*/ createWriteContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateReality = /*#__PURE__*/ createSimulateContract({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityAskQuestion = /*#__PURE__*/ createSimulateContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'askQuestion',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"askQuestionWithMinBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityAskQuestionWithMinBond =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'askQuestionWithMinBond',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"assignWinnerAndSubmitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityAssignWinnerAndSubmitAnswerByArbitrator =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'assignWinnerAndSubmitAnswerByArbitrator',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"cancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityCancelArbitration =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'cancelArbitration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimMultipleAndWithdrawBalance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityClaimMultipleAndWithdrawBalance =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimMultipleAndWithdrawBalance',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"claimWinnings"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityClaimWinnings =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'claimWinnings',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityCreateTemplate =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplate',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"createTemplateAndAskQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityCreateTemplateAndAskQuestion =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'createTemplateAndAskQuestion',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"fundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityFundAnswerBounty =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'fundAnswerBounty',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"notifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityNotifyOfArbitrationRequest =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'notifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"reopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityReopenQuestion =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'reopenQuestion',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"setQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySetQuestionFee =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'setQuestionFee',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySubmitAnswer = /*#__PURE__*/ createSimulateContract(
  { abi: realityAbi, address: realityAddress, functionName: 'submitAnswer' },
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerByArbitrator"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySubmitAnswerByArbitrator =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerByArbitrator',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerCommitment"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySubmitAnswerCommitment =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerCommitment',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerFor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySubmitAnswerFor =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerFor',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"submitAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealitySubmitAnswerReveal =
  /*#__PURE__*/ createSimulateContract({
    abi: realityAbi,
    address: realityAddress,
    functionName: 'submitAnswerReveal',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link realityAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const simulateRealityWithdraw = /*#__PURE__*/ createSimulateContract({
  abi: realityAbi,
  address: realityAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: realityAbi,
  address: realityAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogAnswerReveal"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogAnswerRevealEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogAnswerReveal',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogCancelArbitration"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogCancelArbitrationEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogCancelArbitration',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogClaimEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: realityAbi, address: realityAddress, eventName: 'LogClaim' },
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogFinalize"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogFinalizeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogFinalize',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogFundAnswerBounty"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogFundAnswerBountyEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogFundAnswerBounty',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogMinimumBond"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogMinimumBondEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogMinimumBond',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewAnswer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogNewAnswerEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewAnswer',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogNewQuestionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewQuestion',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNewTemplate"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogNewTemplateEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNewTemplate',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogNotifyOfArbitrationRequest"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogNotifyOfArbitrationRequestEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogNotifyOfArbitrationRequest',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogReopenQuestion"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogReopenQuestionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogReopenQuestion',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogSetQuestionFee"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogSetQuestionFeeEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogSetQuestionFee',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link realityAbi}__ and `eventName` set to `"LogWithdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x5b7dd1e86623548af054a4985f7fc8ccbb554e2c)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x0eF940F7f053a2eF5D6578841072488aF0c7d89A)
 * - [__View Contract on Gnosis Gnosisscan__](https://gnosisscan.io/address/0xE78996A233895bE74a66F451f1019cA9734205cc)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA)
 */
export const watchRealityLogWithdrawEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: realityAbi,
    address: realityAddress,
    eventName: 'LogWithdraw',
  })
