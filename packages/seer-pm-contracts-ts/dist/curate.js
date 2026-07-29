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

// generated/contracts/curate.ts
var curate_exports = {};
__export(curate_exports, {
  lightGeneralizedTcrAbi: () => lightGeneralizedTcrAbi,
  lightGeneralizedTcrAddress: () => lightGeneralizedTcrAddress,
  lightGeneralizedTcrConfig: () => lightGeneralizedTcrConfig,
  readLightGeneralizedTcr: () => readLightGeneralizedTcr,
  readLightGeneralizedTcrArbitrationParamsChanges: () => readLightGeneralizedTcrArbitrationParamsChanges,
  readLightGeneralizedTcrArbitrator: () => readLightGeneralizedTcrArbitrator,
  readLightGeneralizedTcrArbitratorDisputeIdToItemId: () => readLightGeneralizedTcrArbitratorDisputeIdToItemId,
  readLightGeneralizedTcrArbitratorExtraData: () => readLightGeneralizedTcrArbitratorExtraData,
  readLightGeneralizedTcrChallengePeriodDuration: () => readLightGeneralizedTcrChallengePeriodDuration,
  readLightGeneralizedTcrGetContributions: () => readLightGeneralizedTcrGetContributions,
  readLightGeneralizedTcrGetEvidenceGroupId: () => readLightGeneralizedTcrGetEvidenceGroupId,
  readLightGeneralizedTcrGetItemInfo: () => readLightGeneralizedTcrGetItemInfo,
  readLightGeneralizedTcrGetRequestInfo: () => readLightGeneralizedTcrGetRequestInfo,
  readLightGeneralizedTcrGetRoundInfo: () => readLightGeneralizedTcrGetRoundInfo,
  readLightGeneralizedTcrGovernor: () => readLightGeneralizedTcrGovernor,
  readLightGeneralizedTcrItems: () => readLightGeneralizedTcrItems,
  readLightGeneralizedTcrLoserStakeMultiplier: () => readLightGeneralizedTcrLoserStakeMultiplier,
  readLightGeneralizedTcrMetaEvidenceUpdates: () => readLightGeneralizedTcrMetaEvidenceUpdates,
  readLightGeneralizedTcrMultiplierDivisor: () => readLightGeneralizedTcrMultiplierDivisor,
  readLightGeneralizedTcrRelayerContract: () => readLightGeneralizedTcrRelayerContract,
  readLightGeneralizedTcrRemovalBaseDeposit: () => readLightGeneralizedTcrRemovalBaseDeposit,
  readLightGeneralizedTcrRemovalChallengeBaseDeposit: () => readLightGeneralizedTcrRemovalChallengeBaseDeposit,
  readLightGeneralizedTcrRequestsDisputeData: () => readLightGeneralizedTcrRequestsDisputeData,
  readLightGeneralizedTcrRulingOptions: () => readLightGeneralizedTcrRulingOptions,
  readLightGeneralizedTcrSharedStakeMultiplier: () => readLightGeneralizedTcrSharedStakeMultiplier,
  readLightGeneralizedTcrSubmissionBaseDeposit: () => readLightGeneralizedTcrSubmissionBaseDeposit,
  readLightGeneralizedTcrSubmissionChallengeBaseDeposit: () => readLightGeneralizedTcrSubmissionChallengeBaseDeposit,
  readLightGeneralizedTcrWinnerStakeMultiplier: () => readLightGeneralizedTcrWinnerStakeMultiplier,
  simulateLightGeneralizedTcr: () => simulateLightGeneralizedTcr,
  simulateLightGeneralizedTcrAddItem: () => simulateLightGeneralizedTcrAddItem,
  simulateLightGeneralizedTcrAddItemDirectly: () => simulateLightGeneralizedTcrAddItemDirectly,
  simulateLightGeneralizedTcrChallengeRequest: () => simulateLightGeneralizedTcrChallengeRequest,
  simulateLightGeneralizedTcrChangeArbitrationParams: () => simulateLightGeneralizedTcrChangeArbitrationParams,
  simulateLightGeneralizedTcrChangeChallengePeriodDuration: () => simulateLightGeneralizedTcrChangeChallengePeriodDuration,
  simulateLightGeneralizedTcrChangeConnectedTcr: () => simulateLightGeneralizedTcrChangeConnectedTcr,
  simulateLightGeneralizedTcrChangeGovernor: () => simulateLightGeneralizedTcrChangeGovernor,
  simulateLightGeneralizedTcrChangeLoserStakeMultiplier: () => simulateLightGeneralizedTcrChangeLoserStakeMultiplier,
  simulateLightGeneralizedTcrChangeRelayerContract: () => simulateLightGeneralizedTcrChangeRelayerContract,
  simulateLightGeneralizedTcrChangeRemovalBaseDeposit: () => simulateLightGeneralizedTcrChangeRemovalBaseDeposit,
  simulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit: () => simulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  simulateLightGeneralizedTcrChangeSharedStakeMultiplier: () => simulateLightGeneralizedTcrChangeSharedStakeMultiplier,
  simulateLightGeneralizedTcrChangeSubmissionBaseDeposit: () => simulateLightGeneralizedTcrChangeSubmissionBaseDeposit,
  simulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit: () => simulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  simulateLightGeneralizedTcrChangeWinnerStakeMultiplier: () => simulateLightGeneralizedTcrChangeWinnerStakeMultiplier,
  simulateLightGeneralizedTcrExecuteRequest: () => simulateLightGeneralizedTcrExecuteRequest,
  simulateLightGeneralizedTcrFundAppeal: () => simulateLightGeneralizedTcrFundAppeal,
  simulateLightGeneralizedTcrInitialize: () => simulateLightGeneralizedTcrInitialize,
  simulateLightGeneralizedTcrRemoveItem: () => simulateLightGeneralizedTcrRemoveItem,
  simulateLightGeneralizedTcrRemoveItemDirectly: () => simulateLightGeneralizedTcrRemoveItemDirectly,
  simulateLightGeneralizedTcrRule: () => simulateLightGeneralizedTcrRule,
  simulateLightGeneralizedTcrSubmitEvidence: () => simulateLightGeneralizedTcrSubmitEvidence,
  simulateLightGeneralizedTcrWithdrawFeesAndRewards: () => simulateLightGeneralizedTcrWithdrawFeesAndRewards,
  useReadLightGeneralizedTcr: () => useReadLightGeneralizedTcr,
  useReadLightGeneralizedTcrArbitrationParamsChanges: () => useReadLightGeneralizedTcrArbitrationParamsChanges,
  useReadLightGeneralizedTcrArbitrator: () => useReadLightGeneralizedTcrArbitrator,
  useReadLightGeneralizedTcrArbitratorDisputeIdToItemId: () => useReadLightGeneralizedTcrArbitratorDisputeIdToItemId,
  useReadLightGeneralizedTcrArbitratorExtraData: () => useReadLightGeneralizedTcrArbitratorExtraData,
  useReadLightGeneralizedTcrChallengePeriodDuration: () => useReadLightGeneralizedTcrChallengePeriodDuration,
  useReadLightGeneralizedTcrGetContributions: () => useReadLightGeneralizedTcrGetContributions,
  useReadLightGeneralizedTcrGetEvidenceGroupId: () => useReadLightGeneralizedTcrGetEvidenceGroupId,
  useReadLightGeneralizedTcrGetItemInfo: () => useReadLightGeneralizedTcrGetItemInfo,
  useReadLightGeneralizedTcrGetRequestInfo: () => useReadLightGeneralizedTcrGetRequestInfo,
  useReadLightGeneralizedTcrGetRoundInfo: () => useReadLightGeneralizedTcrGetRoundInfo,
  useReadLightGeneralizedTcrGovernor: () => useReadLightGeneralizedTcrGovernor,
  useReadLightGeneralizedTcrItems: () => useReadLightGeneralizedTcrItems,
  useReadLightGeneralizedTcrLoserStakeMultiplier: () => useReadLightGeneralizedTcrLoserStakeMultiplier,
  useReadLightGeneralizedTcrMetaEvidenceUpdates: () => useReadLightGeneralizedTcrMetaEvidenceUpdates,
  useReadLightGeneralizedTcrMultiplierDivisor: () => useReadLightGeneralizedTcrMultiplierDivisor,
  useReadLightGeneralizedTcrRelayerContract: () => useReadLightGeneralizedTcrRelayerContract,
  useReadLightGeneralizedTcrRemovalBaseDeposit: () => useReadLightGeneralizedTcrRemovalBaseDeposit,
  useReadLightGeneralizedTcrRemovalChallengeBaseDeposit: () => useReadLightGeneralizedTcrRemovalChallengeBaseDeposit,
  useReadLightGeneralizedTcrRequestsDisputeData: () => useReadLightGeneralizedTcrRequestsDisputeData,
  useReadLightGeneralizedTcrRulingOptions: () => useReadLightGeneralizedTcrRulingOptions,
  useReadLightGeneralizedTcrSharedStakeMultiplier: () => useReadLightGeneralizedTcrSharedStakeMultiplier,
  useReadLightGeneralizedTcrSubmissionBaseDeposit: () => useReadLightGeneralizedTcrSubmissionBaseDeposit,
  useReadLightGeneralizedTcrSubmissionChallengeBaseDeposit: () => useReadLightGeneralizedTcrSubmissionChallengeBaseDeposit,
  useReadLightGeneralizedTcrWinnerStakeMultiplier: () => useReadLightGeneralizedTcrWinnerStakeMultiplier,
  useSimulateLightGeneralizedTcr: () => useSimulateLightGeneralizedTcr,
  useSimulateLightGeneralizedTcrAddItem: () => useSimulateLightGeneralizedTcrAddItem,
  useSimulateLightGeneralizedTcrAddItemDirectly: () => useSimulateLightGeneralizedTcrAddItemDirectly,
  useSimulateLightGeneralizedTcrChallengeRequest: () => useSimulateLightGeneralizedTcrChallengeRequest,
  useSimulateLightGeneralizedTcrChangeArbitrationParams: () => useSimulateLightGeneralizedTcrChangeArbitrationParams,
  useSimulateLightGeneralizedTcrChangeChallengePeriodDuration: () => useSimulateLightGeneralizedTcrChangeChallengePeriodDuration,
  useSimulateLightGeneralizedTcrChangeConnectedTcr: () => useSimulateLightGeneralizedTcrChangeConnectedTcr,
  useSimulateLightGeneralizedTcrChangeGovernor: () => useSimulateLightGeneralizedTcrChangeGovernor,
  useSimulateLightGeneralizedTcrChangeLoserStakeMultiplier: () => useSimulateLightGeneralizedTcrChangeLoserStakeMultiplier,
  useSimulateLightGeneralizedTcrChangeRelayerContract: () => useSimulateLightGeneralizedTcrChangeRelayerContract,
  useSimulateLightGeneralizedTcrChangeRemovalBaseDeposit: () => useSimulateLightGeneralizedTcrChangeRemovalBaseDeposit,
  useSimulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit: () => useSimulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  useSimulateLightGeneralizedTcrChangeSharedStakeMultiplier: () => useSimulateLightGeneralizedTcrChangeSharedStakeMultiplier,
  useSimulateLightGeneralizedTcrChangeSubmissionBaseDeposit: () => useSimulateLightGeneralizedTcrChangeSubmissionBaseDeposit,
  useSimulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit: () => useSimulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  useSimulateLightGeneralizedTcrChangeWinnerStakeMultiplier: () => useSimulateLightGeneralizedTcrChangeWinnerStakeMultiplier,
  useSimulateLightGeneralizedTcrExecuteRequest: () => useSimulateLightGeneralizedTcrExecuteRequest,
  useSimulateLightGeneralizedTcrFundAppeal: () => useSimulateLightGeneralizedTcrFundAppeal,
  useSimulateLightGeneralizedTcrInitialize: () => useSimulateLightGeneralizedTcrInitialize,
  useSimulateLightGeneralizedTcrRemoveItem: () => useSimulateLightGeneralizedTcrRemoveItem,
  useSimulateLightGeneralizedTcrRemoveItemDirectly: () => useSimulateLightGeneralizedTcrRemoveItemDirectly,
  useSimulateLightGeneralizedTcrRule: () => useSimulateLightGeneralizedTcrRule,
  useSimulateLightGeneralizedTcrSubmitEvidence: () => useSimulateLightGeneralizedTcrSubmitEvidence,
  useSimulateLightGeneralizedTcrWithdrawFeesAndRewards: () => useSimulateLightGeneralizedTcrWithdrawFeesAndRewards,
  useWatchLightGeneralizedTcrConnectedTcrSetEvent: () => useWatchLightGeneralizedTcrConnectedTcrSetEvent,
  useWatchLightGeneralizedTcrContributionEvent: () => useWatchLightGeneralizedTcrContributionEvent,
  useWatchLightGeneralizedTcrDisputeEvent: () => useWatchLightGeneralizedTcrDisputeEvent,
  useWatchLightGeneralizedTcrEvent: () => useWatchLightGeneralizedTcrEvent,
  useWatchLightGeneralizedTcrEvidenceEvent: () => useWatchLightGeneralizedTcrEvidenceEvent,
  useWatchLightGeneralizedTcrItemStatusChangeEvent: () => useWatchLightGeneralizedTcrItemStatusChangeEvent,
  useWatchLightGeneralizedTcrMetaEvidenceEvent: () => useWatchLightGeneralizedTcrMetaEvidenceEvent,
  useWatchLightGeneralizedTcrNewItemEvent: () => useWatchLightGeneralizedTcrNewItemEvent,
  useWatchLightGeneralizedTcrRequestSubmittedEvent: () => useWatchLightGeneralizedTcrRequestSubmittedEvent,
  useWatchLightGeneralizedTcrRewardWithdrawnEvent: () => useWatchLightGeneralizedTcrRewardWithdrawnEvent,
  useWatchLightGeneralizedTcrRulingEvent: () => useWatchLightGeneralizedTcrRulingEvent,
  useWriteLightGeneralizedTcr: () => useWriteLightGeneralizedTcr,
  useWriteLightGeneralizedTcrAddItem: () => useWriteLightGeneralizedTcrAddItem,
  useWriteLightGeneralizedTcrAddItemDirectly: () => useWriteLightGeneralizedTcrAddItemDirectly,
  useWriteLightGeneralizedTcrChallengeRequest: () => useWriteLightGeneralizedTcrChallengeRequest,
  useWriteLightGeneralizedTcrChangeArbitrationParams: () => useWriteLightGeneralizedTcrChangeArbitrationParams,
  useWriteLightGeneralizedTcrChangeChallengePeriodDuration: () => useWriteLightGeneralizedTcrChangeChallengePeriodDuration,
  useWriteLightGeneralizedTcrChangeConnectedTcr: () => useWriteLightGeneralizedTcrChangeConnectedTcr,
  useWriteLightGeneralizedTcrChangeGovernor: () => useWriteLightGeneralizedTcrChangeGovernor,
  useWriteLightGeneralizedTcrChangeLoserStakeMultiplier: () => useWriteLightGeneralizedTcrChangeLoserStakeMultiplier,
  useWriteLightGeneralizedTcrChangeRelayerContract: () => useWriteLightGeneralizedTcrChangeRelayerContract,
  useWriteLightGeneralizedTcrChangeRemovalBaseDeposit: () => useWriteLightGeneralizedTcrChangeRemovalBaseDeposit,
  useWriteLightGeneralizedTcrChangeRemovalChallengeBaseDeposit: () => useWriteLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  useWriteLightGeneralizedTcrChangeSharedStakeMultiplier: () => useWriteLightGeneralizedTcrChangeSharedStakeMultiplier,
  useWriteLightGeneralizedTcrChangeSubmissionBaseDeposit: () => useWriteLightGeneralizedTcrChangeSubmissionBaseDeposit,
  useWriteLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit: () => useWriteLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  useWriteLightGeneralizedTcrChangeWinnerStakeMultiplier: () => useWriteLightGeneralizedTcrChangeWinnerStakeMultiplier,
  useWriteLightGeneralizedTcrExecuteRequest: () => useWriteLightGeneralizedTcrExecuteRequest,
  useWriteLightGeneralizedTcrFundAppeal: () => useWriteLightGeneralizedTcrFundAppeal,
  useWriteLightGeneralizedTcrInitialize: () => useWriteLightGeneralizedTcrInitialize,
  useWriteLightGeneralizedTcrRemoveItem: () => useWriteLightGeneralizedTcrRemoveItem,
  useWriteLightGeneralizedTcrRemoveItemDirectly: () => useWriteLightGeneralizedTcrRemoveItemDirectly,
  useWriteLightGeneralizedTcrRule: () => useWriteLightGeneralizedTcrRule,
  useWriteLightGeneralizedTcrSubmitEvidence: () => useWriteLightGeneralizedTcrSubmitEvidence,
  useWriteLightGeneralizedTcrWithdrawFeesAndRewards: () => useWriteLightGeneralizedTcrWithdrawFeesAndRewards,
  watchLightGeneralizedTcrConnectedTcrSetEvent: () => watchLightGeneralizedTcrConnectedTcrSetEvent,
  watchLightGeneralizedTcrContributionEvent: () => watchLightGeneralizedTcrContributionEvent,
  watchLightGeneralizedTcrDisputeEvent: () => watchLightGeneralizedTcrDisputeEvent,
  watchLightGeneralizedTcrEvent: () => watchLightGeneralizedTcrEvent,
  watchLightGeneralizedTcrEvidenceEvent: () => watchLightGeneralizedTcrEvidenceEvent,
  watchLightGeneralizedTcrItemStatusChangeEvent: () => watchLightGeneralizedTcrItemStatusChangeEvent,
  watchLightGeneralizedTcrMetaEvidenceEvent: () => watchLightGeneralizedTcrMetaEvidenceEvent,
  watchLightGeneralizedTcrNewItemEvent: () => watchLightGeneralizedTcrNewItemEvent,
  watchLightGeneralizedTcrRequestSubmittedEvent: () => watchLightGeneralizedTcrRequestSubmittedEvent,
  watchLightGeneralizedTcrRewardWithdrawnEvent: () => watchLightGeneralizedTcrRewardWithdrawnEvent,
  watchLightGeneralizedTcrRulingEvent: () => watchLightGeneralizedTcrRulingEvent,
  writeLightGeneralizedTcr: () => writeLightGeneralizedTcr,
  writeLightGeneralizedTcrAddItem: () => writeLightGeneralizedTcrAddItem,
  writeLightGeneralizedTcrAddItemDirectly: () => writeLightGeneralizedTcrAddItemDirectly,
  writeLightGeneralizedTcrChallengeRequest: () => writeLightGeneralizedTcrChallengeRequest,
  writeLightGeneralizedTcrChangeArbitrationParams: () => writeLightGeneralizedTcrChangeArbitrationParams,
  writeLightGeneralizedTcrChangeChallengePeriodDuration: () => writeLightGeneralizedTcrChangeChallengePeriodDuration,
  writeLightGeneralizedTcrChangeConnectedTcr: () => writeLightGeneralizedTcrChangeConnectedTcr,
  writeLightGeneralizedTcrChangeGovernor: () => writeLightGeneralizedTcrChangeGovernor,
  writeLightGeneralizedTcrChangeLoserStakeMultiplier: () => writeLightGeneralizedTcrChangeLoserStakeMultiplier,
  writeLightGeneralizedTcrChangeRelayerContract: () => writeLightGeneralizedTcrChangeRelayerContract,
  writeLightGeneralizedTcrChangeRemovalBaseDeposit: () => writeLightGeneralizedTcrChangeRemovalBaseDeposit,
  writeLightGeneralizedTcrChangeRemovalChallengeBaseDeposit: () => writeLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  writeLightGeneralizedTcrChangeSharedStakeMultiplier: () => writeLightGeneralizedTcrChangeSharedStakeMultiplier,
  writeLightGeneralizedTcrChangeSubmissionBaseDeposit: () => writeLightGeneralizedTcrChangeSubmissionBaseDeposit,
  writeLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit: () => writeLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  writeLightGeneralizedTcrChangeWinnerStakeMultiplier: () => writeLightGeneralizedTcrChangeWinnerStakeMultiplier,
  writeLightGeneralizedTcrExecuteRequest: () => writeLightGeneralizedTcrExecuteRequest,
  writeLightGeneralizedTcrFundAppeal: () => writeLightGeneralizedTcrFundAppeal,
  writeLightGeneralizedTcrInitialize: () => writeLightGeneralizedTcrInitialize,
  writeLightGeneralizedTcrRemoveItem: () => writeLightGeneralizedTcrRemoveItem,
  writeLightGeneralizedTcrRemoveItemDirectly: () => writeLightGeneralizedTcrRemoveItemDirectly,
  writeLightGeneralizedTcrRule: () => writeLightGeneralizedTcrRule,
  writeLightGeneralizedTcrSubmitEvidence: () => writeLightGeneralizedTcrSubmitEvidence,
  writeLightGeneralizedTcrWithdrawFeesAndRewards: () => writeLightGeneralizedTcrWithdrawFeesAndRewards
});
module.exports = __toCommonJS(curate_exports);
var import_codegen = require("wagmi/codegen");
var import_codegen2 = require("wagmi/codegen");
var lightGeneralizedTcrAbi = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_connectedTCR",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ConnectedTCRSet"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_itemID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requestID",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_roundID",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_contributor",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_contribution",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_side",
        internalType: "enum LightGeneralizedTCR.Party",
        type: "uint8",
        indexed: false
      }
    ],
    name: "Contribution"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address",
        indexed: true
      },
      {
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_metaEvidenceID",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_evidenceGroupID",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Dispute"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address",
        indexed: true
      },
      {
        name: "_evidenceGroupID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_party",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_evidence",
        internalType: "string",
        type: "string",
        indexed: false
      }
    ],
    name: "Evidence"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_itemID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_updatedDirectly",
        internalType: "bool",
        type: "bool",
        indexed: false
      }
    ],
    name: "ItemStatusChange"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_metaEvidenceID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_evidence",
        internalType: "string",
        type: "string",
        indexed: false
      }
    ],
    name: "MetaEvidence"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_itemID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      { name: "_data", internalType: "string", type: "string", indexed: false },
      {
        name: "_addedDirectly",
        internalType: "bool",
        type: "bool",
        indexed: false
      }
    ],
    name: "NewItem"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_itemID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_evidenceGroupID",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "RequestSubmitted"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_beneficiary",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_itemID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_request",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      },
      {
        name: "_reward",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "RewardWithdrawn"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address",
        indexed: true
      },
      {
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Ruling"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "MULTIPLIER_DIVISOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "RULING_OPTIONS",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: true,
    type: "function",
    inputs: [{ name: "_item", internalType: "string", type: "string" }],
    name: "addItem",
    outputs: [],
    stateMutability: "payable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [{ name: "_item", internalType: "string", type: "string" }],
    name: "addItemDirectly",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationParamsChanges",
    outputs: [
      {
        name: "arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "arbitratorExtraData", internalType: "bytes", type: "bytes" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [
      { name: "", internalType: "contract IArbitrator", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" }
    ],
    name: "arbitratorDisputeIDToItemID",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "arbitratorExtraData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "challengePeriodDuration",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: true,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_evidence", internalType: "string", type: "string" }
    ],
    name: "challengeRequest",
    outputs: [],
    stateMutability: "payable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      {
        name: "_registrationMetaEvidence",
        internalType: "string",
        type: "string"
      },
      { name: "_clearingMetaEvidence", internalType: "string", type: "string" }
    ],
    name: "changeArbitrationParams",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_challengePeriodDuration",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeChallengePeriodDuration",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      { name: "_connectedTCR", internalType: "address", type: "address" }
    ],
    name: "changeConnectedTCR",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [{ name: "_governor", internalType: "address", type: "address" }],
    name: "changeGovernor",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_loserStakeMultiplier",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeLoserStakeMultiplier",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      { name: "_relayerContract", internalType: "address", type: "address" }
    ],
    name: "changeRelayerContract",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      { name: "_removalBaseDeposit", internalType: "uint256", type: "uint256" }
    ],
    name: "changeRemovalBaseDeposit",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_removalChallengeBaseDeposit",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeRemovalChallengeBaseDeposit",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_sharedStakeMultiplier",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeSharedStakeMultiplier",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_submissionBaseDeposit",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeSubmissionBaseDeposit",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_submissionChallengeBaseDeposit",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeSubmissionChallengeBaseDeposit",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_winnerStakeMultiplier",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    name: "changeWinnerStakeMultiplier",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [{ name: "_itemID", internalType: "bytes32", type: "bytes32" }],
    name: "executeRequest",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: false,
    payable: true,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      {
        name: "_side",
        internalType: "enum LightGeneralizedTCR.Party",
        type: "uint8"
      }
    ],
    name: "fundAppeal",
    outputs: [],
    stateMutability: "payable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_requestID", internalType: "uint256", type: "uint256" },
      { name: "_roundID", internalType: "uint256", type: "uint256" },
      { name: "_contributor", internalType: "address", type: "address" }
    ],
    name: "getContributions",
    outputs: [
      { name: "contributions", internalType: "uint256[3]", type: "uint256[3]" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_requestID", internalType: "uint256", type: "uint256" }
    ],
    name: "getEvidenceGroupID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [{ name: "_itemID", internalType: "bytes32", type: "bytes32" }],
    name: "getItemInfo",
    outputs: [
      {
        name: "status",
        internalType: "enum LightGeneralizedTCR.Status",
        type: "uint8"
      },
      { name: "numberOfRequests", internalType: "uint256", type: "uint256" },
      { name: "sumDeposit", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_requestID", internalType: "uint256", type: "uint256" }
    ],
    name: "getRequestInfo",
    outputs: [
      { name: "disputed", internalType: "bool", type: "bool" },
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      { name: "submissionTime", internalType: "uint256", type: "uint256" },
      { name: "resolved", internalType: "bool", type: "bool" },
      {
        name: "parties",
        internalType: "address payable[3]",
        type: "address[3]"
      },
      { name: "numberOfRounds", internalType: "uint256", type: "uint256" },
      {
        name: "ruling",
        internalType: "enum LightGeneralizedTCR.Party",
        type: "uint8"
      },
      {
        name: "requestArbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      {
        name: "requestArbitratorExtraData",
        internalType: "bytes",
        type: "bytes"
      },
      { name: "metaEvidenceID", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_requestID", internalType: "uint256", type: "uint256" },
      { name: "_roundID", internalType: "uint256", type: "uint256" }
    ],
    name: "getRoundInfo",
    outputs: [
      { name: "appealed", internalType: "bool", type: "bool" },
      { name: "amountPaid", internalType: "uint256[3]", type: "uint256[3]" },
      { name: "hasPaid", internalType: "bool[3]", type: "bool[3]" },
      { name: "feeRewards", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "governor",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      { name: "_connectedTCR", internalType: "address", type: "address" },
      {
        name: "_registrationMetaEvidence",
        internalType: "string",
        type: "string"
      },
      { name: "_clearingMetaEvidence", internalType: "string", type: "string" },
      { name: "_governor", internalType: "address", type: "address" },
      { name: "_baseDeposits", internalType: "uint256[4]", type: "uint256[4]" },
      {
        name: "_challengePeriodDuration",
        internalType: "uint256",
        type: "uint256"
      },
      {
        name: "_stakeMultipliers",
        internalType: "uint256[3]",
        type: "uint256[3]"
      },
      { name: "_relayerContract", internalType: "address", type: "address" }
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "items",
    outputs: [
      {
        name: "status",
        internalType: "enum LightGeneralizedTCR.Status",
        type: "uint8"
      },
      { name: "sumDeposit", internalType: "uint128", type: "uint128" },
      { name: "requestCount", internalType: "uint120", type: "uint120" }
    ],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "loserStakeMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "metaEvidenceUpdates",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "relayerContract",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "removalBaseDeposit",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "removalChallengeBaseDeposit",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: true,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_evidence", internalType: "string", type: "string" }
    ],
    name: "removeItem",
    outputs: [],
    stateMutability: "payable"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [{ name: "_itemID", internalType: "bytes32", type: "bytes32" }],
    name: "removeItemDirectly",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [
      { name: "", internalType: "bytes32", type: "bytes32" },
      { name: "", internalType: "uint256", type: "uint256" }
    ],
    name: "requestsDisputeData",
    outputs: [
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      {
        name: "status",
        internalType: "enum LightGeneralizedTCR.DisputeStatus",
        type: "uint8"
      },
      {
        name: "ruling",
        internalType: "enum LightGeneralizedTCR.Party",
        type: "uint8"
      },
      { name: "roundCount", internalType: "uint240", type: "uint240" }
    ],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      { name: "_disputeID", internalType: "uint256", type: "uint256" },
      { name: "_ruling", internalType: "uint256", type: "uint256" }
    ],
    name: "rule",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "sharedStakeMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "submissionBaseDeposit",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "submissionChallengeBaseDeposit",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_evidence", internalType: "string", type: "string" }
    ],
    name: "submitEvidence",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    constant: true,
    payable: false,
    type: "function",
    inputs: [],
    name: "winnerStakeMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    constant: false,
    payable: false,
    type: "function",
    inputs: [
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_itemID", internalType: "bytes32", type: "bytes32" },
      { name: "_requestID", internalType: "uint256", type: "uint256" },
      { name: "_roundID", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewards",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var lightGeneralizedTcrAddress = {
  1: "0x4A9f8e73b3c4c9d7fA0210b9de457b1c493a3AdA",
  10: "0x0000000000000000000000000000000000000000",
  100: "0x5aAF9E23A11440F8C1Ad6D2E2e5109C7e52CC672",
  8453: "0x0000000000000000000000000000000000000000",
  11155111: "0x06140fb869486363818196B61704493a8790F73C"
};
var lightGeneralizedTcrConfig = {
  address: lightGeneralizedTcrAddress,
  abi: lightGeneralizedTcrAbi
};
var useReadLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var useReadLightGeneralizedTcrMultiplierDivisor = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var useReadLightGeneralizedTcrRulingOptions = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "RULING_OPTIONS"
});
var useReadLightGeneralizedTcrArbitrationParamsChanges = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitrationParamsChanges"
});
var useReadLightGeneralizedTcrArbitrator = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitrator"
});
var useReadLightGeneralizedTcrArbitratorDisputeIdToItemId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitratorDisputeIDToItemID"
});
var useReadLightGeneralizedTcrArbitratorExtraData = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitratorExtraData"
});
var useReadLightGeneralizedTcrChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengePeriodDuration"
});
var useReadLightGeneralizedTcrGetContributions = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getContributions"
});
var useReadLightGeneralizedTcrGetEvidenceGroupId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getEvidenceGroupID"
});
var useReadLightGeneralizedTcrGetItemInfo = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getItemInfo"
});
var useReadLightGeneralizedTcrGetRequestInfo = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getRequestInfo"
});
var useReadLightGeneralizedTcrGetRoundInfo = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getRoundInfo"
});
var useReadLightGeneralizedTcrGovernor = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "governor"
});
var useReadLightGeneralizedTcrItems = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "items"
});
var useReadLightGeneralizedTcrLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "loserStakeMultiplier"
});
var useReadLightGeneralizedTcrMetaEvidenceUpdates = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "metaEvidenceUpdates"
});
var useReadLightGeneralizedTcrRelayerContract = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "relayerContract"
});
var useReadLightGeneralizedTcrRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removalBaseDeposit"
});
var useReadLightGeneralizedTcrRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removalChallengeBaseDeposit"
});
var useReadLightGeneralizedTcrRequestsDisputeData = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "requestsDisputeData"
});
var useReadLightGeneralizedTcrSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "sharedStakeMultiplier"
});
var useReadLightGeneralizedTcrSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submissionBaseDeposit"
});
var useReadLightGeneralizedTcrSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submissionChallengeBaseDeposit"
});
var useReadLightGeneralizedTcrWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "winnerStakeMultiplier"
});
var useWriteLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)(
  { abi: lightGeneralizedTcrAbi, address: lightGeneralizedTcrAddress }
);
var useWriteLightGeneralizedTcrAddItem = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItem"
});
var useWriteLightGeneralizedTcrAddItemDirectly = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItemDirectly"
});
var useWriteLightGeneralizedTcrChallengeRequest = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengeRequest"
});
var useWriteLightGeneralizedTcrChangeArbitrationParams = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeArbitrationParams"
});
var useWriteLightGeneralizedTcrChangeChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeChallengePeriodDuration"
});
var useWriteLightGeneralizedTcrChangeConnectedTcr = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeConnectedTCR"
});
var useWriteLightGeneralizedTcrChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeGovernor"
});
var useWriteLightGeneralizedTcrChangeLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeLoserStakeMultiplier"
});
var useWriteLightGeneralizedTcrChangeRelayerContract = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRelayerContract"
});
var useWriteLightGeneralizedTcrChangeRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalBaseDeposit"
});
var useWriteLightGeneralizedTcrChangeRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalChallengeBaseDeposit"
});
var useWriteLightGeneralizedTcrChangeSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSharedStakeMultiplier"
});
var useWriteLightGeneralizedTcrChangeSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionBaseDeposit"
});
var useWriteLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionChallengeBaseDeposit"
});
var useWriteLightGeneralizedTcrChangeWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeWinnerStakeMultiplier"
});
var useWriteLightGeneralizedTcrExecuteRequest = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "executeRequest"
});
var useWriteLightGeneralizedTcrFundAppeal = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "fundAppeal"
});
var useWriteLightGeneralizedTcrInitialize = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "initialize"
});
var useWriteLightGeneralizedTcrRemoveItem = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItem"
});
var useWriteLightGeneralizedTcrRemoveItemDirectly = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItemDirectly"
});
var useWriteLightGeneralizedTcrRule = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "rule"
});
var useWriteLightGeneralizedTcrSubmitEvidence = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submitEvidence"
});
var useWriteLightGeneralizedTcrWithdrawFeesAndRewards = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "withdrawFeesAndRewards"
});
var useSimulateLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var useSimulateLightGeneralizedTcrAddItem = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItem"
});
var useSimulateLightGeneralizedTcrAddItemDirectly = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItemDirectly"
});
var useSimulateLightGeneralizedTcrChallengeRequest = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengeRequest"
});
var useSimulateLightGeneralizedTcrChangeArbitrationParams = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeArbitrationParams"
});
var useSimulateLightGeneralizedTcrChangeChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeChallengePeriodDuration"
});
var useSimulateLightGeneralizedTcrChangeConnectedTcr = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeConnectedTCR"
});
var useSimulateLightGeneralizedTcrChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeGovernor"
});
var useSimulateLightGeneralizedTcrChangeLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeLoserStakeMultiplier"
});
var useSimulateLightGeneralizedTcrChangeRelayerContract = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRelayerContract"
});
var useSimulateLightGeneralizedTcrChangeRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalBaseDeposit"
});
var useSimulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalChallengeBaseDeposit"
});
var useSimulateLightGeneralizedTcrChangeSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSharedStakeMultiplier"
});
var useSimulateLightGeneralizedTcrChangeSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionBaseDeposit"
});
var useSimulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionChallengeBaseDeposit"
});
var useSimulateLightGeneralizedTcrChangeWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeWinnerStakeMultiplier"
});
var useSimulateLightGeneralizedTcrExecuteRequest = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "executeRequest"
});
var useSimulateLightGeneralizedTcrFundAppeal = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "fundAppeal"
});
var useSimulateLightGeneralizedTcrInitialize = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "initialize"
});
var useSimulateLightGeneralizedTcrRemoveItem = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItem"
});
var useSimulateLightGeneralizedTcrRemoveItemDirectly = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItemDirectly"
});
var useSimulateLightGeneralizedTcrRule = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "rule"
});
var useSimulateLightGeneralizedTcrSubmitEvidence = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submitEvidence"
});
var useSimulateLightGeneralizedTcrWithdrawFeesAndRewards = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "withdrawFeesAndRewards"
});
var useWatchLightGeneralizedTcrEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var useWatchLightGeneralizedTcrConnectedTcrSetEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "ConnectedTCRSet"
});
var useWatchLightGeneralizedTcrContributionEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Contribution"
});
var useWatchLightGeneralizedTcrDisputeEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Dispute"
});
var useWatchLightGeneralizedTcrEvidenceEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Evidence"
});
var useWatchLightGeneralizedTcrItemStatusChangeEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "ItemStatusChange"
});
var useWatchLightGeneralizedTcrMetaEvidenceEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "MetaEvidence"
});
var useWatchLightGeneralizedTcrNewItemEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "NewItem"
});
var useWatchLightGeneralizedTcrRequestSubmittedEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "RequestSubmitted"
});
var useWatchLightGeneralizedTcrRewardWithdrawnEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "RewardWithdrawn"
});
var useWatchLightGeneralizedTcrRulingEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Ruling"
});
var readLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var readLightGeneralizedTcrMultiplierDivisor = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var readLightGeneralizedTcrRulingOptions = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "RULING_OPTIONS"
});
var readLightGeneralizedTcrArbitrationParamsChanges = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitrationParamsChanges"
});
var readLightGeneralizedTcrArbitrator = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitrator"
});
var readLightGeneralizedTcrArbitratorDisputeIdToItemId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitratorDisputeIDToItemID"
});
var readLightGeneralizedTcrArbitratorExtraData = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "arbitratorExtraData"
});
var readLightGeneralizedTcrChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengePeriodDuration"
});
var readLightGeneralizedTcrGetContributions = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getContributions"
});
var readLightGeneralizedTcrGetEvidenceGroupId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getEvidenceGroupID"
});
var readLightGeneralizedTcrGetItemInfo = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getItemInfo"
});
var readLightGeneralizedTcrGetRequestInfo = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getRequestInfo"
});
var readLightGeneralizedTcrGetRoundInfo = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "getRoundInfo"
});
var readLightGeneralizedTcrGovernor = /* @__PURE__ */ (0, import_codegen2.createReadContract)(
  {
    abi: lightGeneralizedTcrAbi,
    address: lightGeneralizedTcrAddress,
    functionName: "governor"
  }
);
var readLightGeneralizedTcrItems = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "items"
});
var readLightGeneralizedTcrLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "loserStakeMultiplier"
});
var readLightGeneralizedTcrMetaEvidenceUpdates = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "metaEvidenceUpdates"
});
var readLightGeneralizedTcrRelayerContract = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "relayerContract"
});
var readLightGeneralizedTcrRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removalBaseDeposit"
});
var readLightGeneralizedTcrRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removalChallengeBaseDeposit"
});
var readLightGeneralizedTcrRequestsDisputeData = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "requestsDisputeData"
});
var readLightGeneralizedTcrSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "sharedStakeMultiplier"
});
var readLightGeneralizedTcrSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submissionBaseDeposit"
});
var readLightGeneralizedTcrSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submissionChallengeBaseDeposit"
});
var readLightGeneralizedTcrWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "winnerStakeMultiplier"
});
var writeLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var writeLightGeneralizedTcrAddItem = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItem"
});
var writeLightGeneralizedTcrAddItemDirectly = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItemDirectly"
});
var writeLightGeneralizedTcrChallengeRequest = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengeRequest"
});
var writeLightGeneralizedTcrChangeArbitrationParams = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeArbitrationParams"
});
var writeLightGeneralizedTcrChangeChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeChallengePeriodDuration"
});
var writeLightGeneralizedTcrChangeConnectedTcr = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeConnectedTCR"
});
var writeLightGeneralizedTcrChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeGovernor"
});
var writeLightGeneralizedTcrChangeLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeLoserStakeMultiplier"
});
var writeLightGeneralizedTcrChangeRelayerContract = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRelayerContract"
});
var writeLightGeneralizedTcrChangeRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalBaseDeposit"
});
var writeLightGeneralizedTcrChangeRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalChallengeBaseDeposit"
});
var writeLightGeneralizedTcrChangeSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSharedStakeMultiplier"
});
var writeLightGeneralizedTcrChangeSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionBaseDeposit"
});
var writeLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionChallengeBaseDeposit"
});
var writeLightGeneralizedTcrChangeWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeWinnerStakeMultiplier"
});
var writeLightGeneralizedTcrExecuteRequest = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "executeRequest"
});
var writeLightGeneralizedTcrFundAppeal = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "fundAppeal"
});
var writeLightGeneralizedTcrInitialize = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "initialize"
});
var writeLightGeneralizedTcrRemoveItem = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItem"
});
var writeLightGeneralizedTcrRemoveItemDirectly = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItemDirectly"
});
var writeLightGeneralizedTcrRule = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "rule"
});
var writeLightGeneralizedTcrSubmitEvidence = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submitEvidence"
});
var writeLightGeneralizedTcrWithdrawFeesAndRewards = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "withdrawFeesAndRewards"
});
var simulateLightGeneralizedTcr = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)(
  { abi: lightGeneralizedTcrAbi, address: lightGeneralizedTcrAddress }
);
var simulateLightGeneralizedTcrAddItem = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItem"
});
var simulateLightGeneralizedTcrAddItemDirectly = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "addItemDirectly"
});
var simulateLightGeneralizedTcrChallengeRequest = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "challengeRequest"
});
var simulateLightGeneralizedTcrChangeArbitrationParams = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeArbitrationParams"
});
var simulateLightGeneralizedTcrChangeChallengePeriodDuration = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeChallengePeriodDuration"
});
var simulateLightGeneralizedTcrChangeConnectedTcr = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeConnectedTCR"
});
var simulateLightGeneralizedTcrChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeGovernor"
});
var simulateLightGeneralizedTcrChangeLoserStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeLoserStakeMultiplier"
});
var simulateLightGeneralizedTcrChangeRelayerContract = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRelayerContract"
});
var simulateLightGeneralizedTcrChangeRemovalBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalBaseDeposit"
});
var simulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeRemovalChallengeBaseDeposit"
});
var simulateLightGeneralizedTcrChangeSharedStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSharedStakeMultiplier"
});
var simulateLightGeneralizedTcrChangeSubmissionBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionBaseDeposit"
});
var simulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeSubmissionChallengeBaseDeposit"
});
var simulateLightGeneralizedTcrChangeWinnerStakeMultiplier = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "changeWinnerStakeMultiplier"
});
var simulateLightGeneralizedTcrExecuteRequest = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "executeRequest"
});
var simulateLightGeneralizedTcrFundAppeal = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "fundAppeal"
});
var simulateLightGeneralizedTcrInitialize = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "initialize"
});
var simulateLightGeneralizedTcrRemoveItem = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItem"
});
var simulateLightGeneralizedTcrRemoveItemDirectly = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "removeItemDirectly"
});
var simulateLightGeneralizedTcrRule = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "rule"
});
var simulateLightGeneralizedTcrSubmitEvidence = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "submitEvidence"
});
var simulateLightGeneralizedTcrWithdrawFeesAndRewards = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  functionName: "withdrawFeesAndRewards"
});
var watchLightGeneralizedTcrEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress
});
var watchLightGeneralizedTcrConnectedTcrSetEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "ConnectedTCRSet"
});
var watchLightGeneralizedTcrContributionEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Contribution"
});
var watchLightGeneralizedTcrDisputeEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Dispute"
});
var watchLightGeneralizedTcrEvidenceEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Evidence"
});
var watchLightGeneralizedTcrItemStatusChangeEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "ItemStatusChange"
});
var watchLightGeneralizedTcrMetaEvidenceEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "MetaEvidence"
});
var watchLightGeneralizedTcrNewItemEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "NewItem"
});
var watchLightGeneralizedTcrRequestSubmittedEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "RequestSubmitted"
});
var watchLightGeneralizedTcrRewardWithdrawnEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "RewardWithdrawn"
});
var watchLightGeneralizedTcrRulingEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: lightGeneralizedTcrAbi,
  address: lightGeneralizedTcrAddress,
  eventName: "Ruling"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  lightGeneralizedTcrAbi,
  lightGeneralizedTcrAddress,
  lightGeneralizedTcrConfig,
  readLightGeneralizedTcr,
  readLightGeneralizedTcrArbitrationParamsChanges,
  readLightGeneralizedTcrArbitrator,
  readLightGeneralizedTcrArbitratorDisputeIdToItemId,
  readLightGeneralizedTcrArbitratorExtraData,
  readLightGeneralizedTcrChallengePeriodDuration,
  readLightGeneralizedTcrGetContributions,
  readLightGeneralizedTcrGetEvidenceGroupId,
  readLightGeneralizedTcrGetItemInfo,
  readLightGeneralizedTcrGetRequestInfo,
  readLightGeneralizedTcrGetRoundInfo,
  readLightGeneralizedTcrGovernor,
  readLightGeneralizedTcrItems,
  readLightGeneralizedTcrLoserStakeMultiplier,
  readLightGeneralizedTcrMetaEvidenceUpdates,
  readLightGeneralizedTcrMultiplierDivisor,
  readLightGeneralizedTcrRelayerContract,
  readLightGeneralizedTcrRemovalBaseDeposit,
  readLightGeneralizedTcrRemovalChallengeBaseDeposit,
  readLightGeneralizedTcrRequestsDisputeData,
  readLightGeneralizedTcrRulingOptions,
  readLightGeneralizedTcrSharedStakeMultiplier,
  readLightGeneralizedTcrSubmissionBaseDeposit,
  readLightGeneralizedTcrSubmissionChallengeBaseDeposit,
  readLightGeneralizedTcrWinnerStakeMultiplier,
  simulateLightGeneralizedTcr,
  simulateLightGeneralizedTcrAddItem,
  simulateLightGeneralizedTcrAddItemDirectly,
  simulateLightGeneralizedTcrChallengeRequest,
  simulateLightGeneralizedTcrChangeArbitrationParams,
  simulateLightGeneralizedTcrChangeChallengePeriodDuration,
  simulateLightGeneralizedTcrChangeConnectedTcr,
  simulateLightGeneralizedTcrChangeGovernor,
  simulateLightGeneralizedTcrChangeLoserStakeMultiplier,
  simulateLightGeneralizedTcrChangeRelayerContract,
  simulateLightGeneralizedTcrChangeRemovalBaseDeposit,
  simulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  simulateLightGeneralizedTcrChangeSharedStakeMultiplier,
  simulateLightGeneralizedTcrChangeSubmissionBaseDeposit,
  simulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  simulateLightGeneralizedTcrChangeWinnerStakeMultiplier,
  simulateLightGeneralizedTcrExecuteRequest,
  simulateLightGeneralizedTcrFundAppeal,
  simulateLightGeneralizedTcrInitialize,
  simulateLightGeneralizedTcrRemoveItem,
  simulateLightGeneralizedTcrRemoveItemDirectly,
  simulateLightGeneralizedTcrRule,
  simulateLightGeneralizedTcrSubmitEvidence,
  simulateLightGeneralizedTcrWithdrawFeesAndRewards,
  useReadLightGeneralizedTcr,
  useReadLightGeneralizedTcrArbitrationParamsChanges,
  useReadLightGeneralizedTcrArbitrator,
  useReadLightGeneralizedTcrArbitratorDisputeIdToItemId,
  useReadLightGeneralizedTcrArbitratorExtraData,
  useReadLightGeneralizedTcrChallengePeriodDuration,
  useReadLightGeneralizedTcrGetContributions,
  useReadLightGeneralizedTcrGetEvidenceGroupId,
  useReadLightGeneralizedTcrGetItemInfo,
  useReadLightGeneralizedTcrGetRequestInfo,
  useReadLightGeneralizedTcrGetRoundInfo,
  useReadLightGeneralizedTcrGovernor,
  useReadLightGeneralizedTcrItems,
  useReadLightGeneralizedTcrLoserStakeMultiplier,
  useReadLightGeneralizedTcrMetaEvidenceUpdates,
  useReadLightGeneralizedTcrMultiplierDivisor,
  useReadLightGeneralizedTcrRelayerContract,
  useReadLightGeneralizedTcrRemovalBaseDeposit,
  useReadLightGeneralizedTcrRemovalChallengeBaseDeposit,
  useReadLightGeneralizedTcrRequestsDisputeData,
  useReadLightGeneralizedTcrRulingOptions,
  useReadLightGeneralizedTcrSharedStakeMultiplier,
  useReadLightGeneralizedTcrSubmissionBaseDeposit,
  useReadLightGeneralizedTcrSubmissionChallengeBaseDeposit,
  useReadLightGeneralizedTcrWinnerStakeMultiplier,
  useSimulateLightGeneralizedTcr,
  useSimulateLightGeneralizedTcrAddItem,
  useSimulateLightGeneralizedTcrAddItemDirectly,
  useSimulateLightGeneralizedTcrChallengeRequest,
  useSimulateLightGeneralizedTcrChangeArbitrationParams,
  useSimulateLightGeneralizedTcrChangeChallengePeriodDuration,
  useSimulateLightGeneralizedTcrChangeConnectedTcr,
  useSimulateLightGeneralizedTcrChangeGovernor,
  useSimulateLightGeneralizedTcrChangeLoserStakeMultiplier,
  useSimulateLightGeneralizedTcrChangeRelayerContract,
  useSimulateLightGeneralizedTcrChangeRemovalBaseDeposit,
  useSimulateLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  useSimulateLightGeneralizedTcrChangeSharedStakeMultiplier,
  useSimulateLightGeneralizedTcrChangeSubmissionBaseDeposit,
  useSimulateLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  useSimulateLightGeneralizedTcrChangeWinnerStakeMultiplier,
  useSimulateLightGeneralizedTcrExecuteRequest,
  useSimulateLightGeneralizedTcrFundAppeal,
  useSimulateLightGeneralizedTcrInitialize,
  useSimulateLightGeneralizedTcrRemoveItem,
  useSimulateLightGeneralizedTcrRemoveItemDirectly,
  useSimulateLightGeneralizedTcrRule,
  useSimulateLightGeneralizedTcrSubmitEvidence,
  useSimulateLightGeneralizedTcrWithdrawFeesAndRewards,
  useWatchLightGeneralizedTcrConnectedTcrSetEvent,
  useWatchLightGeneralizedTcrContributionEvent,
  useWatchLightGeneralizedTcrDisputeEvent,
  useWatchLightGeneralizedTcrEvent,
  useWatchLightGeneralizedTcrEvidenceEvent,
  useWatchLightGeneralizedTcrItemStatusChangeEvent,
  useWatchLightGeneralizedTcrMetaEvidenceEvent,
  useWatchLightGeneralizedTcrNewItemEvent,
  useWatchLightGeneralizedTcrRequestSubmittedEvent,
  useWatchLightGeneralizedTcrRewardWithdrawnEvent,
  useWatchLightGeneralizedTcrRulingEvent,
  useWriteLightGeneralizedTcr,
  useWriteLightGeneralizedTcrAddItem,
  useWriteLightGeneralizedTcrAddItemDirectly,
  useWriteLightGeneralizedTcrChallengeRequest,
  useWriteLightGeneralizedTcrChangeArbitrationParams,
  useWriteLightGeneralizedTcrChangeChallengePeriodDuration,
  useWriteLightGeneralizedTcrChangeConnectedTcr,
  useWriteLightGeneralizedTcrChangeGovernor,
  useWriteLightGeneralizedTcrChangeLoserStakeMultiplier,
  useWriteLightGeneralizedTcrChangeRelayerContract,
  useWriteLightGeneralizedTcrChangeRemovalBaseDeposit,
  useWriteLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  useWriteLightGeneralizedTcrChangeSharedStakeMultiplier,
  useWriteLightGeneralizedTcrChangeSubmissionBaseDeposit,
  useWriteLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  useWriteLightGeneralizedTcrChangeWinnerStakeMultiplier,
  useWriteLightGeneralizedTcrExecuteRequest,
  useWriteLightGeneralizedTcrFundAppeal,
  useWriteLightGeneralizedTcrInitialize,
  useWriteLightGeneralizedTcrRemoveItem,
  useWriteLightGeneralizedTcrRemoveItemDirectly,
  useWriteLightGeneralizedTcrRule,
  useWriteLightGeneralizedTcrSubmitEvidence,
  useWriteLightGeneralizedTcrWithdrawFeesAndRewards,
  watchLightGeneralizedTcrConnectedTcrSetEvent,
  watchLightGeneralizedTcrContributionEvent,
  watchLightGeneralizedTcrDisputeEvent,
  watchLightGeneralizedTcrEvent,
  watchLightGeneralizedTcrEvidenceEvent,
  watchLightGeneralizedTcrItemStatusChangeEvent,
  watchLightGeneralizedTcrMetaEvidenceEvent,
  watchLightGeneralizedTcrNewItemEvent,
  watchLightGeneralizedTcrRequestSubmittedEvent,
  watchLightGeneralizedTcrRewardWithdrawnEvent,
  watchLightGeneralizedTcrRulingEvent,
  writeLightGeneralizedTcr,
  writeLightGeneralizedTcrAddItem,
  writeLightGeneralizedTcrAddItemDirectly,
  writeLightGeneralizedTcrChallengeRequest,
  writeLightGeneralizedTcrChangeArbitrationParams,
  writeLightGeneralizedTcrChangeChallengePeriodDuration,
  writeLightGeneralizedTcrChangeConnectedTcr,
  writeLightGeneralizedTcrChangeGovernor,
  writeLightGeneralizedTcrChangeLoserStakeMultiplier,
  writeLightGeneralizedTcrChangeRelayerContract,
  writeLightGeneralizedTcrChangeRemovalBaseDeposit,
  writeLightGeneralizedTcrChangeRemovalChallengeBaseDeposit,
  writeLightGeneralizedTcrChangeSharedStakeMultiplier,
  writeLightGeneralizedTcrChangeSubmissionBaseDeposit,
  writeLightGeneralizedTcrChangeSubmissionChallengeBaseDeposit,
  writeLightGeneralizedTcrChangeWinnerStakeMultiplier,
  writeLightGeneralizedTcrExecuteRequest,
  writeLightGeneralizedTcrFundAppeal,
  writeLightGeneralizedTcrInitialize,
  writeLightGeneralizedTcrRemoveItem,
  writeLightGeneralizedTcrRemoveItemDirectly,
  writeLightGeneralizedTcrRule,
  writeLightGeneralizedTcrSubmitEvidence,
  writeLightGeneralizedTcrWithdrawFeesAndRewards
});
