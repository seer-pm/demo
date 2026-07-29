"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// generated/contracts/reality.ts
var reality_exports = {};
__export(reality_exports, {
  readReality: () => readReality,
  readRealityArbitratorQuestionFees: () => readRealityArbitratorQuestionFees,
  readRealityBalanceOf: () => readRealityBalanceOf,
  readRealityCommitments: () => readRealityCommitments,
  readRealityGetArbitrator: () => readRealityGetArbitrator,
  readRealityGetBestAnswer: () => readRealityGetBestAnswer,
  readRealityGetBond: () => readRealityGetBond,
  readRealityGetBounty: () => readRealityGetBounty,
  readRealityGetContentHash: () => readRealityGetContentHash,
  readRealityGetFinalAnswer: () => readRealityGetFinalAnswer,
  readRealityGetFinalAnswerIfMatches: () => readRealityGetFinalAnswerIfMatches,
  readRealityGetFinalizeTs: () => readRealityGetFinalizeTs,
  readRealityGetHistoryHash: () => readRealityGetHistoryHash,
  readRealityGetMinBond: () => readRealityGetMinBond,
  readRealityGetOpeningTs: () => readRealityGetOpeningTs,
  readRealityGetTimeout: () => readRealityGetTimeout,
  readRealityIsFinalized: () => readRealityIsFinalized,
  readRealityIsPendingArbitration: () => readRealityIsPendingArbitration,
  readRealityIsSettledTooSoon: () => readRealityIsSettledTooSoon,
  readRealityQuestionClaims: () => readRealityQuestionClaims,
  readRealityQuestions: () => readRealityQuestions,
  readRealityReopenedQuestions: () => readRealityReopenedQuestions,
  readRealityReopenerQuestions: () => readRealityReopenerQuestions,
  readRealityResultFor: () => readRealityResultFor,
  readRealityResultForOnceSettled: () => readRealityResultForOnceSettled,
  readRealityTemplateHashes: () => readRealityTemplateHashes,
  readRealityTemplates: () => readRealityTemplates,
  realityAbi: () => realityAbi,
  realityAddress: () => realityAddress,
  realityConfig: () => realityConfig,
  simulateReality: () => simulateReality,
  simulateRealityAskQuestion: () => simulateRealityAskQuestion,
  simulateRealityAskQuestionWithMinBond: () => simulateRealityAskQuestionWithMinBond,
  simulateRealityAssignWinnerAndSubmitAnswerByArbitrator: () => simulateRealityAssignWinnerAndSubmitAnswerByArbitrator,
  simulateRealityCancelArbitration: () => simulateRealityCancelArbitration,
  simulateRealityClaimMultipleAndWithdrawBalance: () => simulateRealityClaimMultipleAndWithdrawBalance,
  simulateRealityClaimWinnings: () => simulateRealityClaimWinnings,
  simulateRealityCreateTemplate: () => simulateRealityCreateTemplate,
  simulateRealityCreateTemplateAndAskQuestion: () => simulateRealityCreateTemplateAndAskQuestion,
  simulateRealityFundAnswerBounty: () => simulateRealityFundAnswerBounty,
  simulateRealityNotifyOfArbitrationRequest: () => simulateRealityNotifyOfArbitrationRequest,
  simulateRealityReopenQuestion: () => simulateRealityReopenQuestion,
  simulateRealitySetQuestionFee: () => simulateRealitySetQuestionFee,
  simulateRealitySubmitAnswer: () => simulateRealitySubmitAnswer,
  simulateRealitySubmitAnswerByArbitrator: () => simulateRealitySubmitAnswerByArbitrator,
  simulateRealitySubmitAnswerCommitment: () => simulateRealitySubmitAnswerCommitment,
  simulateRealitySubmitAnswerFor: () => simulateRealitySubmitAnswerFor,
  simulateRealitySubmitAnswerReveal: () => simulateRealitySubmitAnswerReveal,
  simulateRealityWithdraw: () => simulateRealityWithdraw,
  useReadReality: () => useReadReality,
  useReadRealityArbitratorQuestionFees: () => useReadRealityArbitratorQuestionFees,
  useReadRealityBalanceOf: () => useReadRealityBalanceOf,
  useReadRealityCommitments: () => useReadRealityCommitments,
  useReadRealityGetArbitrator: () => useReadRealityGetArbitrator,
  useReadRealityGetBestAnswer: () => useReadRealityGetBestAnswer,
  useReadRealityGetBond: () => useReadRealityGetBond,
  useReadRealityGetBounty: () => useReadRealityGetBounty,
  useReadRealityGetContentHash: () => useReadRealityGetContentHash,
  useReadRealityGetFinalAnswer: () => useReadRealityGetFinalAnswer,
  useReadRealityGetFinalAnswerIfMatches: () => useReadRealityGetFinalAnswerIfMatches,
  useReadRealityGetFinalizeTs: () => useReadRealityGetFinalizeTs,
  useReadRealityGetHistoryHash: () => useReadRealityGetHistoryHash,
  useReadRealityGetMinBond: () => useReadRealityGetMinBond,
  useReadRealityGetOpeningTs: () => useReadRealityGetOpeningTs,
  useReadRealityGetTimeout: () => useReadRealityGetTimeout,
  useReadRealityIsFinalized: () => useReadRealityIsFinalized,
  useReadRealityIsPendingArbitration: () => useReadRealityIsPendingArbitration,
  useReadRealityIsSettledTooSoon: () => useReadRealityIsSettledTooSoon,
  useReadRealityQuestionClaims: () => useReadRealityQuestionClaims,
  useReadRealityQuestions: () => useReadRealityQuestions,
  useReadRealityReopenedQuestions: () => useReadRealityReopenedQuestions,
  useReadRealityReopenerQuestions: () => useReadRealityReopenerQuestions,
  useReadRealityResultFor: () => useReadRealityResultFor,
  useReadRealityResultForOnceSettled: () => useReadRealityResultForOnceSettled,
  useReadRealityTemplateHashes: () => useReadRealityTemplateHashes,
  useReadRealityTemplates: () => useReadRealityTemplates,
  useSimulateReality: () => useSimulateReality,
  useSimulateRealityAskQuestion: () => useSimulateRealityAskQuestion,
  useSimulateRealityAskQuestionWithMinBond: () => useSimulateRealityAskQuestionWithMinBond,
  useSimulateRealityAssignWinnerAndSubmitAnswerByArbitrator: () => useSimulateRealityAssignWinnerAndSubmitAnswerByArbitrator,
  useSimulateRealityCancelArbitration: () => useSimulateRealityCancelArbitration,
  useSimulateRealityClaimMultipleAndWithdrawBalance: () => useSimulateRealityClaimMultipleAndWithdrawBalance,
  useSimulateRealityClaimWinnings: () => useSimulateRealityClaimWinnings,
  useSimulateRealityCreateTemplate: () => useSimulateRealityCreateTemplate,
  useSimulateRealityCreateTemplateAndAskQuestion: () => useSimulateRealityCreateTemplateAndAskQuestion,
  useSimulateRealityFundAnswerBounty: () => useSimulateRealityFundAnswerBounty,
  useSimulateRealityNotifyOfArbitrationRequest: () => useSimulateRealityNotifyOfArbitrationRequest,
  useSimulateRealityReopenQuestion: () => useSimulateRealityReopenQuestion,
  useSimulateRealitySetQuestionFee: () => useSimulateRealitySetQuestionFee,
  useSimulateRealitySubmitAnswer: () => useSimulateRealitySubmitAnswer,
  useSimulateRealitySubmitAnswerByArbitrator: () => useSimulateRealitySubmitAnswerByArbitrator,
  useSimulateRealitySubmitAnswerCommitment: () => useSimulateRealitySubmitAnswerCommitment,
  useSimulateRealitySubmitAnswerFor: () => useSimulateRealitySubmitAnswerFor,
  useSimulateRealitySubmitAnswerReveal: () => useSimulateRealitySubmitAnswerReveal,
  useSimulateRealityWithdraw: () => useSimulateRealityWithdraw,
  useWatchRealityEvent: () => useWatchRealityEvent,
  useWatchRealityLogAnswerRevealEvent: () => useWatchRealityLogAnswerRevealEvent,
  useWatchRealityLogCancelArbitrationEvent: () => useWatchRealityLogCancelArbitrationEvent,
  useWatchRealityLogClaimEvent: () => useWatchRealityLogClaimEvent,
  useWatchRealityLogFinalizeEvent: () => useWatchRealityLogFinalizeEvent,
  useWatchRealityLogFundAnswerBountyEvent: () => useWatchRealityLogFundAnswerBountyEvent,
  useWatchRealityLogMinimumBondEvent: () => useWatchRealityLogMinimumBondEvent,
  useWatchRealityLogNewAnswerEvent: () => useWatchRealityLogNewAnswerEvent,
  useWatchRealityLogNewQuestionEvent: () => useWatchRealityLogNewQuestionEvent,
  useWatchRealityLogNewTemplateEvent: () => useWatchRealityLogNewTemplateEvent,
  useWatchRealityLogNotifyOfArbitrationRequestEvent: () => useWatchRealityLogNotifyOfArbitrationRequestEvent,
  useWatchRealityLogReopenQuestionEvent: () => useWatchRealityLogReopenQuestionEvent,
  useWatchRealityLogSetQuestionFeeEvent: () => useWatchRealityLogSetQuestionFeeEvent,
  useWatchRealityLogWithdrawEvent: () => useWatchRealityLogWithdrawEvent,
  useWriteReality: () => useWriteReality,
  useWriteRealityAskQuestion: () => useWriteRealityAskQuestion,
  useWriteRealityAskQuestionWithMinBond: () => useWriteRealityAskQuestionWithMinBond,
  useWriteRealityAssignWinnerAndSubmitAnswerByArbitrator: () => useWriteRealityAssignWinnerAndSubmitAnswerByArbitrator,
  useWriteRealityCancelArbitration: () => useWriteRealityCancelArbitration,
  useWriteRealityClaimMultipleAndWithdrawBalance: () => useWriteRealityClaimMultipleAndWithdrawBalance,
  useWriteRealityClaimWinnings: () => useWriteRealityClaimWinnings,
  useWriteRealityCreateTemplate: () => useWriteRealityCreateTemplate,
  useWriteRealityCreateTemplateAndAskQuestion: () => useWriteRealityCreateTemplateAndAskQuestion,
  useWriteRealityFundAnswerBounty: () => useWriteRealityFundAnswerBounty,
  useWriteRealityNotifyOfArbitrationRequest: () => useWriteRealityNotifyOfArbitrationRequest,
  useWriteRealityReopenQuestion: () => useWriteRealityReopenQuestion,
  useWriteRealitySetQuestionFee: () => useWriteRealitySetQuestionFee,
  useWriteRealitySubmitAnswer: () => useWriteRealitySubmitAnswer,
  useWriteRealitySubmitAnswerByArbitrator: () => useWriteRealitySubmitAnswerByArbitrator,
  useWriteRealitySubmitAnswerCommitment: () => useWriteRealitySubmitAnswerCommitment,
  useWriteRealitySubmitAnswerFor: () => useWriteRealitySubmitAnswerFor,
  useWriteRealitySubmitAnswerReveal: () => useWriteRealitySubmitAnswerReveal,
  useWriteRealityWithdraw: () => useWriteRealityWithdraw,
  watchRealityEvent: () => watchRealityEvent,
  watchRealityLogAnswerRevealEvent: () => watchRealityLogAnswerRevealEvent,
  watchRealityLogCancelArbitrationEvent: () => watchRealityLogCancelArbitrationEvent,
  watchRealityLogClaimEvent: () => watchRealityLogClaimEvent,
  watchRealityLogFinalizeEvent: () => watchRealityLogFinalizeEvent,
  watchRealityLogFundAnswerBountyEvent: () => watchRealityLogFundAnswerBountyEvent,
  watchRealityLogMinimumBondEvent: () => watchRealityLogMinimumBondEvent,
  watchRealityLogNewAnswerEvent: () => watchRealityLogNewAnswerEvent,
  watchRealityLogNewQuestionEvent: () => watchRealityLogNewQuestionEvent,
  watchRealityLogNewTemplateEvent: () => watchRealityLogNewTemplateEvent,
  watchRealityLogNotifyOfArbitrationRequestEvent: () => watchRealityLogNotifyOfArbitrationRequestEvent,
  watchRealityLogReopenQuestionEvent: () => watchRealityLogReopenQuestionEvent,
  watchRealityLogSetQuestionFeeEvent: () => watchRealityLogSetQuestionFeeEvent,
  watchRealityLogWithdrawEvent: () => watchRealityLogWithdrawEvent,
  writeReality: () => writeReality,
  writeRealityAskQuestion: () => writeRealityAskQuestion,
  writeRealityAskQuestionWithMinBond: () => writeRealityAskQuestionWithMinBond,
  writeRealityAssignWinnerAndSubmitAnswerByArbitrator: () => writeRealityAssignWinnerAndSubmitAnswerByArbitrator,
  writeRealityCancelArbitration: () => writeRealityCancelArbitration,
  writeRealityClaimMultipleAndWithdrawBalance: () => writeRealityClaimMultipleAndWithdrawBalance,
  writeRealityClaimWinnings: () => writeRealityClaimWinnings,
  writeRealityCreateTemplate: () => writeRealityCreateTemplate,
  writeRealityCreateTemplateAndAskQuestion: () => writeRealityCreateTemplateAndAskQuestion,
  writeRealityFundAnswerBounty: () => writeRealityFundAnswerBounty,
  writeRealityNotifyOfArbitrationRequest: () => writeRealityNotifyOfArbitrationRequest,
  writeRealityReopenQuestion: () => writeRealityReopenQuestion,
  writeRealitySetQuestionFee: () => writeRealitySetQuestionFee,
  writeRealitySubmitAnswer: () => writeRealitySubmitAnswer,
  writeRealitySubmitAnswerByArbitrator: () => writeRealitySubmitAnswerByArbitrator,
  writeRealitySubmitAnswerCommitment: () => writeRealitySubmitAnswerCommitment,
  writeRealitySubmitAnswerFor: () => writeRealitySubmitAnswerFor,
  writeRealitySubmitAnswerReveal: () => writeRealitySubmitAnswerReveal,
  writeRealityWithdraw: () => writeRealityWithdraw
});
module.exports = __toCommonJS(reality_exports);
var import_codegen = require("wagmi/codegen");
var import_codegen2 = require("wagmi/codegen");
var realityAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "answer_hash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "answer",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "bond",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogAnswerReveal"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      }
    ],
    name: "LogCancelArbitration"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogClaim"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "answer",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      }
    ],
    name: "LogFinalize"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "bounty_added",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "bounty",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      { name: "user", internalType: "address", type: "address", indexed: true }
    ],
    name: "LogFundAnswerBounty"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "min_bond",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogMinimumBond"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "answer",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "history_hash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "bond",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      { name: "ts", internalType: "uint256", type: "uint256", indexed: false },
      {
        name: "is_commitment",
        internalType: "bool",
        type: "bool",
        indexed: false
      }
    ],
    name: "LogNewAnswer"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "template_id",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "question",
        internalType: "string",
        type: "string",
        indexed: false
      },
      {
        name: "content_hash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "arbitrator",
        internalType: "address",
        type: "address",
        indexed: false
      },
      {
        name: "timeout",
        internalType: "uint32",
        type: "uint32",
        indexed: false
      },
      {
        name: "opening_ts",
        internalType: "uint32",
        type: "uint32",
        indexed: false
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "created",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogNewQuestion"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "template_id",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "question_text",
        internalType: "string",
        type: "string",
        indexed: false
      }
    ],
    name: "LogNewTemplate"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      { name: "user", internalType: "address", type: "address", indexed: true }
    ],
    name: "LogNotifyOfArbitrationRequest"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "reopened_question_id",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      }
    ],
    name: "LogReopenQuestion"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "arbitrator",
        internalType: "address",
        type: "address",
        indexed: false
      },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogSetQuestionFee"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "LogWithdraw"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "arbitrator_question_fees",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "template_id", internalType: "uint256", type: "uint256" },
      { name: "question", internalType: "string", type: "string" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "timeout", internalType: "uint32", type: "uint32" },
      { name: "opening_ts", internalType: "uint32", type: "uint32" },
      { name: "nonce", internalType: "uint256", type: "uint256" }
    ],
    name: "askQuestion",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "template_id", internalType: "uint256", type: "uint256" },
      { name: "question", internalType: "string", type: "string" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "timeout", internalType: "uint32", type: "uint32" },
      { name: "opening_ts", internalType: "uint32", type: "uint32" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
      { name: "min_bond", internalType: "uint256", type: "uint256" }
    ],
    name: "askQuestionWithMinBond",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer", internalType: "bytes32", type: "bytes32" },
      { name: "payee_if_wrong", internalType: "address", type: "address" },
      { name: "last_history_hash", internalType: "bytes32", type: "bytes32" },
      {
        name: "last_answer_or_commitment_id",
        internalType: "bytes32",
        type: "bytes32"
      },
      { name: "last_answerer", internalType: "address", type: "address" }
    ],
    name: "assignWinnerAndSubmitAnswerByArbitrator",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "cancelArbitration",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_ids", internalType: "bytes32[]", type: "bytes32[]" },
      { name: "lengths", internalType: "uint256[]", type: "uint256[]" },
      { name: "hist_hashes", internalType: "bytes32[]", type: "bytes32[]" },
      { name: "addrs", internalType: "address[]", type: "address[]" },
      { name: "bonds", internalType: "uint256[]", type: "uint256[]" },
      { name: "answers", internalType: "bytes32[]", type: "bytes32[]" }
    ],
    name: "claimMultipleAndWithdrawBalance",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "history_hashes", internalType: "bytes32[]", type: "bytes32[]" },
      { name: "addrs", internalType: "address[]", type: "address[]" },
      { name: "bonds", internalType: "uint256[]", type: "uint256[]" },
      { name: "answers", internalType: "bytes32[]", type: "bytes32[]" }
    ],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "commitments",
    outputs: [
      { name: "reveal_ts", internalType: "uint32", type: "uint32" },
      { name: "is_revealed", internalType: "bool", type: "bool" },
      { name: "revealed_answer", internalType: "bytes32", type: "bytes32" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "content", internalType: "string", type: "string" }],
    name: "createTemplate",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "content", internalType: "string", type: "string" },
      { name: "question", internalType: "string", type: "string" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "timeout", internalType: "uint32", type: "uint32" },
      { name: "opening_ts", internalType: "uint32", type: "uint32" },
      { name: "nonce", internalType: "uint256", type: "uint256" }
    ],
    name: "createTemplateAndAskQuestion",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "fundAnswerBounty",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getArbitrator",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getBestAnswer",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getBond",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getBounty",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getContentHash",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getFinalAnswer",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "content_hash", internalType: "bytes32", type: "bytes32" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "min_timeout", internalType: "uint32", type: "uint32" },
      { name: "min_bond", internalType: "uint256", type: "uint256" }
    ],
    name: "getFinalAnswerIfMatches",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getFinalizeTS",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getHistoryHash",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getMinBond",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getOpeningTS",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "getTimeout",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "isFinalized",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "isPendingArbitration",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "isSettledTooSoon",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "requester", internalType: "address", type: "address" },
      { name: "max_previous", internalType: "uint256", type: "uint256" }
    ],
    name: "notifyOfArbitrationRequest",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "question_claims",
    outputs: [
      { name: "payee", internalType: "address", type: "address" },
      { name: "last_bond", internalType: "uint256", type: "uint256" },
      { name: "queued_funds", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "questions",
    outputs: [
      { name: "content_hash", internalType: "bytes32", type: "bytes32" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "opening_ts", internalType: "uint32", type: "uint32" },
      { name: "timeout", internalType: "uint32", type: "uint32" },
      { name: "finalize_ts", internalType: "uint32", type: "uint32" },
      { name: "is_pending_arbitration", internalType: "bool", type: "bool" },
      { name: "bounty", internalType: "uint256", type: "uint256" },
      { name: "best_answer", internalType: "bytes32", type: "bytes32" },
      { name: "history_hash", internalType: "bytes32", type: "bytes32" },
      { name: "bond", internalType: "uint256", type: "uint256" },
      { name: "min_bond", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "template_id", internalType: "uint256", type: "uint256" },
      { name: "question", internalType: "string", type: "string" },
      { name: "arbitrator", internalType: "address", type: "address" },
      { name: "timeout", internalType: "uint32", type: "uint32" },
      { name: "opening_ts", internalType: "uint32", type: "uint32" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
      { name: "min_bond", internalType: "uint256", type: "uint256" },
      { name: "reopens_question_id", internalType: "bytes32", type: "bytes32" }
    ],
    name: "reopenQuestion",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "reopened_questions",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "reopener_questions",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "resultFor",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "question_id", internalType: "bytes32", type: "bytes32" }],
    name: "resultForOnceSettled",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "fee", internalType: "uint256", type: "uint256" }],
    name: "setQuestionFee",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer", internalType: "bytes32", type: "bytes32" },
      { name: "max_previous", internalType: "uint256", type: "uint256" }
    ],
    name: "submitAnswer",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer", internalType: "bytes32", type: "bytes32" },
      { name: "answerer", internalType: "address", type: "address" }
    ],
    name: "submitAnswerByArbitrator",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer_hash", internalType: "bytes32", type: "bytes32" },
      { name: "max_previous", internalType: "uint256", type: "uint256" },
      { name: "_answerer", internalType: "address", type: "address" }
    ],
    name: "submitAnswerCommitment",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer", internalType: "bytes32", type: "bytes32" },
      { name: "max_previous", internalType: "uint256", type: "uint256" },
      { name: "answerer", internalType: "address", type: "address" }
    ],
    name: "submitAnswerFor",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "question_id", internalType: "bytes32", type: "bytes32" },
      { name: "answer", internalType: "bytes32", type: "bytes32" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
      { name: "bond", internalType: "uint256", type: "uint256" }
    ],
    name: "submitAnswerReveal",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "template_hashes",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "templates",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var realityAddress = {
  1: "0x5b7dD1E86623548AF054A4985F7fc8Ccbb554E2c",
  10: "0x0eF940F7f053a2eF5D6578841072488aF0c7d89A",
  100: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  8453: "0x2F39f464d16402Ca3D8527dA89617b73DE2F60e8",
  11155111: "0xaf33DcB6E8c5c4D9dDF579f53031b514d19449CA"
};
var realityConfig = {
  address: realityAddress,
  abi: realityAbi
};
var useReadReality = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress
});
var useReadRealityArbitratorQuestionFees = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "arbitrator_question_fees"
});
var useReadRealityBalanceOf = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "balanceOf"
});
var useReadRealityCommitments = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "commitments"
});
var useReadRealityGetArbitrator = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getArbitrator"
});
var useReadRealityGetBestAnswer = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBestAnswer"
});
var useReadRealityGetBond = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBond"
});
var useReadRealityGetBounty = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBounty"
});
var useReadRealityGetContentHash = /* @__PURE__ */ (0, import_codegen.createUseReadContract)(
  { abi: realityAbi, address: realityAddress, functionName: "getContentHash" }
);
var useReadRealityGetFinalAnswer = /* @__PURE__ */ (0, import_codegen.createUseReadContract)(
  { abi: realityAbi, address: realityAddress, functionName: "getFinalAnswer" }
);
var useReadRealityGetFinalAnswerIfMatches = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getFinalAnswerIfMatches"
});
var useReadRealityGetFinalizeTs = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getFinalizeTS"
});
var useReadRealityGetHistoryHash = /* @__PURE__ */ (0, import_codegen.createUseReadContract)(
  { abi: realityAbi, address: realityAddress, functionName: "getHistoryHash" }
);
var useReadRealityGetMinBond = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getMinBond"
});
var useReadRealityGetOpeningTs = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getOpeningTS"
});
var useReadRealityGetTimeout = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getTimeout"
});
var useReadRealityIsFinalized = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "isFinalized"
});
var useReadRealityIsPendingArbitration = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "isPendingArbitration"
});
var useReadRealityIsSettledTooSoon = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "isSettledTooSoon"
});
var useReadRealityQuestionClaims = /* @__PURE__ */ (0, import_codegen.createUseReadContract)(
  { abi: realityAbi, address: realityAddress, functionName: "question_claims" }
);
var useReadRealityQuestions = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "questions"
});
var useReadRealityReopenedQuestions = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopened_questions"
});
var useReadRealityReopenerQuestions = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopener_questions"
});
var useReadRealityResultFor = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "resultFor"
});
var useReadRealityResultForOnceSettled = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "resultForOnceSettled"
});
var useReadRealityTemplateHashes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)(
  { abi: realityAbi, address: realityAddress, functionName: "template_hashes" }
);
var useReadRealityTemplates = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "templates"
});
var useWriteReality = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress
});
var useWriteRealityAskQuestion = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestion"
});
var useWriteRealityAskQuestionWithMinBond = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestionWithMinBond"
});
var useWriteRealityAssignWinnerAndSubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "assignWinnerAndSubmitAnswerByArbitrator"
});
var useWriteRealityCancelArbitration = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "cancelArbitration"
});
var useWriteRealityClaimMultipleAndWithdrawBalance = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimMultipleAndWithdrawBalance"
});
var useWriteRealityClaimWinnings = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimWinnings"
});
var useWriteRealityCreateTemplate = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplate"
});
var useWriteRealityCreateTemplateAndAskQuestion = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplateAndAskQuestion"
});
var useWriteRealityFundAnswerBounty = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "fundAnswerBounty"
});
var useWriteRealityNotifyOfArbitrationRequest = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "notifyOfArbitrationRequest"
});
var useWriteRealityReopenQuestion = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopenQuestion"
});
var useWriteRealitySetQuestionFee = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "setQuestionFee"
});
var useWriteRealitySubmitAnswer = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)(
  { abi: realityAbi, address: realityAddress, functionName: "submitAnswer" }
);
var useWriteRealitySubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerByArbitrator"
});
var useWriteRealitySubmitAnswerCommitment = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerCommitment"
});
var useWriteRealitySubmitAnswerFor = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerFor"
});
var useWriteRealitySubmitAnswerReveal = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerReveal"
});
var useWriteRealityWithdraw = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "withdraw"
});
var useSimulateReality = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress
});
var useSimulateRealityAskQuestion = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestion"
});
var useSimulateRealityAskQuestionWithMinBond = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestionWithMinBond"
});
var useSimulateRealityAssignWinnerAndSubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "assignWinnerAndSubmitAnswerByArbitrator"
});
var useSimulateRealityCancelArbitration = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "cancelArbitration"
});
var useSimulateRealityClaimMultipleAndWithdrawBalance = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimMultipleAndWithdrawBalance"
});
var useSimulateRealityClaimWinnings = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimWinnings"
});
var useSimulateRealityCreateTemplate = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplate"
});
var useSimulateRealityCreateTemplateAndAskQuestion = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplateAndAskQuestion"
});
var useSimulateRealityFundAnswerBounty = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "fundAnswerBounty"
});
var useSimulateRealityNotifyOfArbitrationRequest = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "notifyOfArbitrationRequest"
});
var useSimulateRealityReopenQuestion = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopenQuestion"
});
var useSimulateRealitySetQuestionFee = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "setQuestionFee"
});
var useSimulateRealitySubmitAnswer = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswer"
});
var useSimulateRealitySubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerByArbitrator"
});
var useSimulateRealitySubmitAnswerCommitment = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerCommitment"
});
var useSimulateRealitySubmitAnswerFor = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerFor"
});
var useSimulateRealitySubmitAnswerReveal = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerReveal"
});
var useSimulateRealityWithdraw = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "withdraw"
});
var useWatchRealityEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress
});
var useWatchRealityLogAnswerRevealEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogAnswerReveal"
});
var useWatchRealityLogCancelArbitrationEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogCancelArbitration"
});
var useWatchRealityLogClaimEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogClaim"
});
var useWatchRealityLogFinalizeEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogFinalize"
});
var useWatchRealityLogFundAnswerBountyEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogFundAnswerBounty"
});
var useWatchRealityLogMinimumBondEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogMinimumBond"
});
var useWatchRealityLogNewAnswerEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewAnswer"
});
var useWatchRealityLogNewQuestionEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewQuestion"
});
var useWatchRealityLogNewTemplateEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewTemplate"
});
var useWatchRealityLogNotifyOfArbitrationRequestEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNotifyOfArbitrationRequest"
});
var useWatchRealityLogReopenQuestionEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogReopenQuestion"
});
var useWatchRealityLogSetQuestionFeeEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogSetQuestionFee"
});
var useWatchRealityLogWithdrawEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogWithdraw"
});
var readReality = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress
});
var readRealityArbitratorQuestionFees = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "arbitrator_question_fees"
});
var readRealityBalanceOf = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "balanceOf"
});
var readRealityCommitments = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "commitments"
});
var readRealityGetArbitrator = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getArbitrator"
});
var readRealityGetBestAnswer = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBestAnswer"
});
var readRealityGetBond = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBond"
});
var readRealityGetBounty = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getBounty"
});
var readRealityGetContentHash = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getContentHash"
});
var readRealityGetFinalAnswer = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getFinalAnswer"
});
var readRealityGetFinalAnswerIfMatches = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getFinalAnswerIfMatches"
});
var readRealityGetFinalizeTs = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getFinalizeTS"
});
var readRealityGetHistoryHash = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getHistoryHash"
});
var readRealityGetMinBond = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getMinBond"
});
var readRealityGetOpeningTs = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getOpeningTS"
});
var readRealityGetTimeout = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "getTimeout"
});
var readRealityIsFinalized = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "isFinalized"
});
var readRealityIsPendingArbitration = /* @__PURE__ */ (0, import_codegen2.createReadContract)(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: "isPendingArbitration"
  }
);
var readRealityIsSettledTooSoon = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "isSettledTooSoon"
});
var readRealityQuestionClaims = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "question_claims"
});
var readRealityQuestions = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "questions"
});
var readRealityReopenedQuestions = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopened_questions"
});
var readRealityReopenerQuestions = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopener_questions"
});
var readRealityResultFor = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "resultFor"
});
var readRealityResultForOnceSettled = /* @__PURE__ */ (0, import_codegen2.createReadContract)(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: "resultForOnceSettled"
  }
);
var readRealityTemplateHashes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "template_hashes"
});
var readRealityTemplates = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "templates"
});
var writeReality = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress
});
var writeRealityAskQuestion = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestion"
});
var writeRealityAskQuestionWithMinBond = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestionWithMinBond"
});
var writeRealityAssignWinnerAndSubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "assignWinnerAndSubmitAnswerByArbitrator"
});
var writeRealityCancelArbitration = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "cancelArbitration"
});
var writeRealityClaimMultipleAndWithdrawBalance = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimMultipleAndWithdrawBalance"
});
var writeRealityClaimWinnings = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimWinnings"
});
var writeRealityCreateTemplate = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplate"
});
var writeRealityCreateTemplateAndAskQuestion = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplateAndAskQuestion"
});
var writeRealityFundAnswerBounty = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "fundAnswerBounty"
});
var writeRealityNotifyOfArbitrationRequest = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "notifyOfArbitrationRequest"
});
var writeRealityReopenQuestion = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopenQuestion"
});
var writeRealitySetQuestionFee = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "setQuestionFee"
});
var writeRealitySubmitAnswer = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswer"
});
var writeRealitySubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerByArbitrator"
});
var writeRealitySubmitAnswerCommitment = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerCommitment"
});
var writeRealitySubmitAnswerFor = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerFor"
});
var writeRealitySubmitAnswerReveal = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: realityAbi,
    address: realityAddress,
    functionName: "submitAnswerReveal"
  }
);
var writeRealityWithdraw = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "withdraw"
});
var simulateReality = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress
});
var simulateRealityAskQuestion = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestion"
});
var simulateRealityAskQuestionWithMinBond = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "askQuestionWithMinBond"
});
var simulateRealityAssignWinnerAndSubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "assignWinnerAndSubmitAnswerByArbitrator"
});
var simulateRealityCancelArbitration = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "cancelArbitration"
});
var simulateRealityClaimMultipleAndWithdrawBalance = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimMultipleAndWithdrawBalance"
});
var simulateRealityClaimWinnings = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "claimWinnings"
});
var simulateRealityCreateTemplate = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplate"
});
var simulateRealityCreateTemplateAndAskQuestion = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "createTemplateAndAskQuestion"
});
var simulateRealityFundAnswerBounty = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "fundAnswerBounty"
});
var simulateRealityNotifyOfArbitrationRequest = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "notifyOfArbitrationRequest"
});
var simulateRealityReopenQuestion = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "reopenQuestion"
});
var simulateRealitySetQuestionFee = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "setQuestionFee"
});
var simulateRealitySubmitAnswer = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)(
  { abi: realityAbi, address: realityAddress, functionName: "submitAnswer" }
);
var simulateRealitySubmitAnswerByArbitrator = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerByArbitrator"
});
var simulateRealitySubmitAnswerCommitment = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerCommitment"
});
var simulateRealitySubmitAnswerFor = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerFor"
});
var simulateRealitySubmitAnswerReveal = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "submitAnswerReveal"
});
var simulateRealityWithdraw = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: realityAbi,
  address: realityAddress,
  functionName: "withdraw"
});
var watchRealityEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress
});
var watchRealityLogAnswerRevealEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogAnswerReveal"
});
var watchRealityLogCancelArbitrationEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogCancelArbitration"
});
var watchRealityLogClaimEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)(
  { abi: realityAbi, address: realityAddress, eventName: "LogClaim" }
);
var watchRealityLogFinalizeEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogFinalize"
});
var watchRealityLogFundAnswerBountyEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogFundAnswerBounty"
});
var watchRealityLogMinimumBondEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogMinimumBond"
});
var watchRealityLogNewAnswerEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewAnswer"
});
var watchRealityLogNewQuestionEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewQuestion"
});
var watchRealityLogNewTemplateEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNewTemplate"
});
var watchRealityLogNotifyOfArbitrationRequestEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogNotifyOfArbitrationRequest"
});
var watchRealityLogReopenQuestionEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogReopenQuestion"
});
var watchRealityLogSetQuestionFeeEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogSetQuestionFee"
});
var watchRealityLogWithdrawEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: realityAbi,
  address: realityAddress,
  eventName: "LogWithdraw"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  readReality,
  readRealityArbitratorQuestionFees,
  readRealityBalanceOf,
  readRealityCommitments,
  readRealityGetArbitrator,
  readRealityGetBestAnswer,
  readRealityGetBond,
  readRealityGetBounty,
  readRealityGetContentHash,
  readRealityGetFinalAnswer,
  readRealityGetFinalAnswerIfMatches,
  readRealityGetFinalizeTs,
  readRealityGetHistoryHash,
  readRealityGetMinBond,
  readRealityGetOpeningTs,
  readRealityGetTimeout,
  readRealityIsFinalized,
  readRealityIsPendingArbitration,
  readRealityIsSettledTooSoon,
  readRealityQuestionClaims,
  readRealityQuestions,
  readRealityReopenedQuestions,
  readRealityReopenerQuestions,
  readRealityResultFor,
  readRealityResultForOnceSettled,
  readRealityTemplateHashes,
  readRealityTemplates,
  realityAbi,
  realityAddress,
  realityConfig,
  simulateReality,
  simulateRealityAskQuestion,
  simulateRealityAskQuestionWithMinBond,
  simulateRealityAssignWinnerAndSubmitAnswerByArbitrator,
  simulateRealityCancelArbitration,
  simulateRealityClaimMultipleAndWithdrawBalance,
  simulateRealityClaimWinnings,
  simulateRealityCreateTemplate,
  simulateRealityCreateTemplateAndAskQuestion,
  simulateRealityFundAnswerBounty,
  simulateRealityNotifyOfArbitrationRequest,
  simulateRealityReopenQuestion,
  simulateRealitySetQuestionFee,
  simulateRealitySubmitAnswer,
  simulateRealitySubmitAnswerByArbitrator,
  simulateRealitySubmitAnswerCommitment,
  simulateRealitySubmitAnswerFor,
  simulateRealitySubmitAnswerReveal,
  simulateRealityWithdraw,
  useReadReality,
  useReadRealityArbitratorQuestionFees,
  useReadRealityBalanceOf,
  useReadRealityCommitments,
  useReadRealityGetArbitrator,
  useReadRealityGetBestAnswer,
  useReadRealityGetBond,
  useReadRealityGetBounty,
  useReadRealityGetContentHash,
  useReadRealityGetFinalAnswer,
  useReadRealityGetFinalAnswerIfMatches,
  useReadRealityGetFinalizeTs,
  useReadRealityGetHistoryHash,
  useReadRealityGetMinBond,
  useReadRealityGetOpeningTs,
  useReadRealityGetTimeout,
  useReadRealityIsFinalized,
  useReadRealityIsPendingArbitration,
  useReadRealityIsSettledTooSoon,
  useReadRealityQuestionClaims,
  useReadRealityQuestions,
  useReadRealityReopenedQuestions,
  useReadRealityReopenerQuestions,
  useReadRealityResultFor,
  useReadRealityResultForOnceSettled,
  useReadRealityTemplateHashes,
  useReadRealityTemplates,
  useSimulateReality,
  useSimulateRealityAskQuestion,
  useSimulateRealityAskQuestionWithMinBond,
  useSimulateRealityAssignWinnerAndSubmitAnswerByArbitrator,
  useSimulateRealityCancelArbitration,
  useSimulateRealityClaimMultipleAndWithdrawBalance,
  useSimulateRealityClaimWinnings,
  useSimulateRealityCreateTemplate,
  useSimulateRealityCreateTemplateAndAskQuestion,
  useSimulateRealityFundAnswerBounty,
  useSimulateRealityNotifyOfArbitrationRequest,
  useSimulateRealityReopenQuestion,
  useSimulateRealitySetQuestionFee,
  useSimulateRealitySubmitAnswer,
  useSimulateRealitySubmitAnswerByArbitrator,
  useSimulateRealitySubmitAnswerCommitment,
  useSimulateRealitySubmitAnswerFor,
  useSimulateRealitySubmitAnswerReveal,
  useSimulateRealityWithdraw,
  useWatchRealityEvent,
  useWatchRealityLogAnswerRevealEvent,
  useWatchRealityLogCancelArbitrationEvent,
  useWatchRealityLogClaimEvent,
  useWatchRealityLogFinalizeEvent,
  useWatchRealityLogFundAnswerBountyEvent,
  useWatchRealityLogMinimumBondEvent,
  useWatchRealityLogNewAnswerEvent,
  useWatchRealityLogNewQuestionEvent,
  useWatchRealityLogNewTemplateEvent,
  useWatchRealityLogNotifyOfArbitrationRequestEvent,
  useWatchRealityLogReopenQuestionEvent,
  useWatchRealityLogSetQuestionFeeEvent,
  useWatchRealityLogWithdrawEvent,
  useWriteReality,
  useWriteRealityAskQuestion,
  useWriteRealityAskQuestionWithMinBond,
  useWriteRealityAssignWinnerAndSubmitAnswerByArbitrator,
  useWriteRealityCancelArbitration,
  useWriteRealityClaimMultipleAndWithdrawBalance,
  useWriteRealityClaimWinnings,
  useWriteRealityCreateTemplate,
  useWriteRealityCreateTemplateAndAskQuestion,
  useWriteRealityFundAnswerBounty,
  useWriteRealityNotifyOfArbitrationRequest,
  useWriteRealityReopenQuestion,
  useWriteRealitySetQuestionFee,
  useWriteRealitySubmitAnswer,
  useWriteRealitySubmitAnswerByArbitrator,
  useWriteRealitySubmitAnswerCommitment,
  useWriteRealitySubmitAnswerFor,
  useWriteRealitySubmitAnswerReveal,
  useWriteRealityWithdraw,
  watchRealityEvent,
  watchRealityLogAnswerRevealEvent,
  watchRealityLogCancelArbitrationEvent,
  watchRealityLogClaimEvent,
  watchRealityLogFinalizeEvent,
  watchRealityLogFundAnswerBountyEvent,
  watchRealityLogMinimumBondEvent,
  watchRealityLogNewAnswerEvent,
  watchRealityLogNewQuestionEvent,
  watchRealityLogNewTemplateEvent,
  watchRealityLogNotifyOfArbitrationRequestEvent,
  watchRealityLogReopenQuestionEvent,
  watchRealityLogSetQuestionFeeEvent,
  watchRealityLogWithdrawEvent,
  writeReality,
  writeRealityAskQuestion,
  writeRealityAskQuestionWithMinBond,
  writeRealityAssignWinnerAndSubmitAnswerByArbitrator,
  writeRealityCancelArbitration,
  writeRealityClaimMultipleAndWithdrawBalance,
  writeRealityClaimWinnings,
  writeRealityCreateTemplate,
  writeRealityCreateTemplateAndAskQuestion,
  writeRealityFundAnswerBounty,
  writeRealityNotifyOfArbitrationRequest,
  writeRealityReopenQuestion,
  writeRealitySetQuestionFee,
  writeRealitySubmitAnswer,
  writeRealitySubmitAnswerByArbitrator,
  writeRealitySubmitAnswerCommitment,
  writeRealitySubmitAnswerFor,
  writeRealitySubmitAnswerReveal,
  writeRealityWithdraw
});
