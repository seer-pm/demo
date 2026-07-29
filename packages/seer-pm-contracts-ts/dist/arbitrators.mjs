// generated/contracts/arbitrators.ts
import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent
} from "wagmi/codegen";
import {
  createReadContract,
  createWriteContract,
  createSimulateContract,
  createWatchContractEvent
} from "wagmi/codegen";
var realitioForeignArbitrationProxyWithAppealsAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_amb", internalType: "contract IAMB", type: "address" },
      { name: "_homeProxy", internalType: "address", type: "address" },
      { name: "_homeChainId", internalType: "bytes32", type: "bytes32" },
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      { name: "_metaEvidence", internalType: "string", type: "string" },
      { name: "_termsOfService", internalType: "string", type: "string" },
      { name: "_winnerMultiplier", internalType: "uint256", type: "uint256" },
      { name: "_loserMultiplier", internalType: "uint256", type: "uint256" },
      {
        name: "_loserAppealPeriodMultiplier",
        internalType: "uint256",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationCanceled"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "ArbitrationCreated"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationFailed"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_maxPrevious",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "ArbitrationRequested"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "ruling",
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
        name: "_amount",
        internalType: "uint256",
        type: "uint256",
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
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "RulingFunded"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
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
        name: "_reward",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Withdrawal"
  },
  {
    type: "function",
    inputs: [],
    name: "META_EVIDENCE_ID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MULTIPLIER_DIVISOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "NUMBER_OF_CHOICES_FOR_ARBITRATOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "amb",
    outputs: [{ name: "", internalType: "contract IAMB", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToDisputeExists",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToRequester",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "address", type: "address" }
    ],
    name: "arbitrationRequests",
    outputs: [
      {
        name: "status",
        internalType: "enum RealitioForeignArbitrationProxyWithAppeals.Status",
        type: "uint8"
      },
      { name: "deposit", internalType: "uint248", type: "uint248" },
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      { name: "answer", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [
      { name: "", internalType: "contract IArbitrator", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitratorExtraData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "disputeIDToDisputeDetails",
    outputs: [
      { name: "arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "requester", internalType: "address", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_externalDisputeID", internalType: "uint256", type: "uint256" }
    ],
    name: "externalIDtoLocalID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "fundAppeal",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_contributor", internalType: "address", type: "address" }
    ],
    name: "getContributionsToSuccessfulFundings",
    outputs: [
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" },
      { name: "contributions", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "getDisputeFee",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "getFundingStatus",
    outputs: [
      { name: "raised", internalType: "uint256", type: "uint256" },
      { name: "fullyFunded", internalType: "bool", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "getMultipliers",
    outputs: [
      { name: "winner", internalType: "uint256", type: "uint256" },
      { name: "loser", internalType: "uint256", type: "uint256" },
      { name: "loserAppealPeriod", internalType: "uint256", type: "uint256" },
      { name: "divisor", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" }
    ],
    name: "getNumberOfRounds",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" }
    ],
    name: "getRoundInfo",
    outputs: [
      { name: "paidFees", internalType: "uint256[]", type: "uint256[]" },
      { name: "feeRewards", internalType: "uint256", type: "uint256" },
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "getTotalWithdrawableAmount",
    outputs: [{ name: "sum", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "handleFailedDisputeCreation",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "homeChainId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "homeProxy",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserAppealPeriodMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "numberOfRulingOptions",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [{ name: "_questionID", internalType: "bytes32", type: "bytes32" }],
    name: "questionIDToArbitrationID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationAcknowledgement",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationCancelation",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" }
    ],
    name: "requestArbitration",
    outputs: [],
    stateMutability: "payable"
  },
  {
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
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_evidenceURI", internalType: "string", type: "string" }
    ],
    name: "submitEvidence",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "termsOfService",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "winnerMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewards",
    outputs: [{ name: "reward", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewardsForAllRounds",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var realitioForeignArbitrationProxyWithAppealsAddress = {
  1: "0xFe0eb5fC686f929Eb26D541D75Bb59F816c0Aa68"
};
var realitioForeignArbitrationProxyWithAppealsConfig = {
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  abi: realitioForeignArbitrationProxyWithAppealsAbi
};
var realitioForeignProxyBaseAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_wNative", internalType: "address", type: "address" },
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      { name: "_metaEvidence", internalType: "string", type: "string" },
      { name: "_winnerMultiplier", internalType: "uint256", type: "uint256" },
      { name: "_loserMultiplier", internalType: "uint256", type: "uint256" },
      {
        name: "_loserAppealPeriodMultiplier",
        internalType: "uint256",
        type: "uint256"
      },
      { name: "_homeProxy", internalType: "address", type: "address" },
      { name: "_messenger", internalType: "address", type: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationCanceled"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "ArbitrationCreated"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationFailed"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_maxPrevious",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "ArbitrationRequested"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "ruling",
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
        name: "_amount",
        internalType: "uint256",
        type: "uint256",
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
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "RulingFunded"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "_ruling",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      }
    ],
    name: "RulingRelayed"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
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
        name: "_reward",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Withdrawal"
  },
  {
    type: "function",
    inputs: [],
    name: "META_EVIDENCE_ID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MIN_GAS_LIMIT",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MULTIPLIER_DIVISOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "NUMBER_OF_CHOICES_FOR_ARBITRATOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "REFUSE_TO_ARBITRATE_REALITIO",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationCreatedBlock",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToDisputeExists",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToRequester",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "address", type: "address" }
    ],
    name: "arbitrationRequests",
    outputs: [
      {
        name: "status",
        internalType: "enum RealitioForeignProxyOptimism.Status",
        type: "uint8"
      },
      { name: "deposit", internalType: "uint248", type: "uint248" },
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      { name: "answer", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [
      { name: "", internalType: "contract IArbitrator", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitratorExtraData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "disputeIDToDisputeDetails",
    outputs: [
      { name: "arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "requester", internalType: "address", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_externalDisputeID", internalType: "uint256", type: "uint256" }
    ],
    name: "externalIDtoLocalID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "fundAppeal",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_contributor", internalType: "address", type: "address" }
    ],
    name: "getContributionsToSuccessfulFundings",
    outputs: [
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" },
      { name: "contributions", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "getDisputeFee",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "getFundingStatus",
    outputs: [
      { name: "raised", internalType: "uint256", type: "uint256" },
      { name: "fullyFunded", internalType: "bool", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "getMultipliers",
    outputs: [
      { name: "winner", internalType: "uint256", type: "uint256" },
      { name: "loser", internalType: "uint256", type: "uint256" },
      { name: "loserAppealPeriod", internalType: "uint256", type: "uint256" },
      { name: "divisor", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" }
    ],
    name: "getNumberOfRounds",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" }
    ],
    name: "getRoundInfo",
    outputs: [
      { name: "paidFees", internalType: "uint256[]", type: "uint256[]" },
      { name: "feeRewards", internalType: "uint256", type: "uint256" },
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "getTotalWithdrawableAmount",
    outputs: [{ name: "sum", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "handleFailedDisputeCreation",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "handleFailedDisputeCreationCustomParameters",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [],
    name: "homeProxy",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserAppealPeriodMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "messenger",
    outputs: [
      {
        name: "",
        internalType: "contract ICrossDomainMessenger",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "numberOfRulingOptions",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [{ name: "_questionID", internalType: "bytes32", type: "bytes32" }],
    name: "questionIDToArbitrationID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationAcknowledgement",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationCancelation",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "relayRule",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "relayRuleCustomParameters",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" }
    ],
    name: "requestArbitration",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "requestArbitrationCustomParameters",
    outputs: [],
    stateMutability: "payable"
  },
  {
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
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_evidenceURI", internalType: "string", type: "string" }
    ],
    name: "submitEvidence",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "wNative",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "winnerMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewards",
    outputs: [{ name: "reward", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewardsForAllRounds",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var realitioForeignProxyBaseAddress = {
  1: "0x54811E1157CCc2BE68Ce4CC850e5ab3382fe627F"
};
var realitioForeignProxyBaseConfig = {
  address: realitioForeignProxyBaseAddress,
  abi: realitioForeignProxyBaseAbi
};
var realitioForeignProxyOptimismAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_wNative", internalType: "address", type: "address" },
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      { name: "_metaEvidence", internalType: "string", type: "string" },
      { name: "_winnerMultiplier", internalType: "uint256", type: "uint256" },
      { name: "_loserMultiplier", internalType: "uint256", type: "uint256" },
      {
        name: "_loserAppealPeriodMultiplier",
        internalType: "uint256",
        type: "uint256"
      },
      { name: "_homeProxy", internalType: "address", type: "address" },
      { name: "_messenger", internalType: "address", type: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationCanceled"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "ArbitrationCreated"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      }
    ],
    name: "ArbitrationFailed"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true
      },
      {
        name: "_requester",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "_maxPrevious",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "ArbitrationRequested"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "ruling",
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
        name: "_amount",
        internalType: "uint256",
        type: "uint256",
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
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "RulingFunded"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      },
      {
        name: "_ruling",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      }
    ],
    name: "RulingRelayed"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
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
        name: "_reward",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Withdrawal"
  },
  {
    type: "function",
    inputs: [],
    name: "META_EVIDENCE_ID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MIN_GAS_LIMIT",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MULTIPLIER_DIVISOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "NUMBER_OF_CHOICES_FOR_ARBITRATOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "REFUSE_TO_ARBITRATE_REALITIO",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationCreatedBlock",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToDisputeExists",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationIDToRequester",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "address", type: "address" }
    ],
    name: "arbitrationRequests",
    outputs: [
      {
        name: "status",
        internalType: "enum RealitioForeignProxyOptimism.Status",
        type: "uint8"
      },
      { name: "deposit", internalType: "uint248", type: "uint248" },
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      { name: "answer", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [
      { name: "", internalType: "contract IArbitrator", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitratorExtraData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "disputeIDToDisputeDetails",
    outputs: [
      { name: "arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "requester", internalType: "address", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_externalDisputeID", internalType: "uint256", type: "uint256" }
    ],
    name: "externalIDtoLocalID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "fundAppeal",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_contributor", internalType: "address", type: "address" }
    ],
    name: "getContributionsToSuccessfulFundings",
    outputs: [
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" },
      { name: "contributions", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "getDisputeFee",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "getFundingStatus",
    outputs: [
      { name: "raised", internalType: "uint256", type: "uint256" },
      { name: "fullyFunded", internalType: "bool", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "getMultipliers",
    outputs: [
      { name: "winner", internalType: "uint256", type: "uint256" },
      { name: "loser", internalType: "uint256", type: "uint256" },
      { name: "loserAppealPeriod", internalType: "uint256", type: "uint256" },
      { name: "divisor", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" }
    ],
    name: "getNumberOfRounds",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_round", internalType: "uint256", type: "uint256" }
    ],
    name: "getRoundInfo",
    outputs: [
      { name: "paidFees", internalType: "uint256[]", type: "uint256[]" },
      { name: "feeRewards", internalType: "uint256", type: "uint256" },
      { name: "fundedAnswers", internalType: "uint256[]", type: "uint256[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "getTotalWithdrawableAmount",
    outputs: [{ name: "sum", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "handleFailedDisputeCreation",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "handleFailedDisputeCreationCustomParameters",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [],
    name: "homeProxy",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserAppealPeriodMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "loserMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "messenger",
    outputs: [
      {
        name: "",
        internalType: "contract ICrossDomainMessenger",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "numberOfRulingOptions",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [{ name: "_questionID", internalType: "bytes32", type: "bytes32" }],
    name: "questionIDToArbitrationID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationAcknowledgement",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "receiveArbitrationCancelation",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" }
    ],
    name: "relayRule",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_requester", internalType: "address", type: "address" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "relayRuleCustomParameters",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" }
    ],
    name: "requestArbitration",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" },
      { name: "_gasLimit", internalType: "uint32", type: "uint32" }
    ],
    name: "requestArbitrationCustomParameters",
    outputs: [],
    stateMutability: "payable"
  },
  {
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
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      { name: "_evidenceURI", internalType: "string", type: "string" }
    ],
    name: "submitEvidence",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "wNative",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "winnerMultiplier",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_round", internalType: "uint256", type: "uint256" },
      { name: "_answer", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewards",
    outputs: [{ name: "reward", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_arbitrationID", internalType: "uint256", type: "uint256" },
      {
        name: "_beneficiary",
        internalType: "address payable",
        type: "address"
      },
      { name: "_contributedTo", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewardsForAllRounds",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var realitioForeignProxyOptimismAddress = {
  1: "0xd8b33e3F5426dB753D1C6c78b43d5151970cd928"
};
var realitioForeignProxyOptimismConfig = {
  address: realitioForeignProxyOptimismAddress,
  abi: realitioForeignProxyOptimismAbi
};
var realitioV2_1ArbitratorWithAppealsAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_realitio",
        internalType: "contract IRealitio",
        type: "address"
      },
      { name: "_metadata", internalType: "string", type: "string" },
      {
        name: "_arbitrator",
        internalType: "contract IArbitrator",
        type: "address"
      },
      { name: "_arbitratorExtraData", internalType: "bytes", type: "bytes" },
      { name: "_metaevidence", internalType: "string", type: "string" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "ruling",
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
        name: "_amount",
        internalType: "uint256",
        type: "uint256",
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
        name: "_disputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_questionID",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false
      }
    ],
    name: "DisputeIDToQuestionID"
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
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      }
    ],
    name: "RulingFunded"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "_localDisputeID",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_round",
        internalType: "uint256",
        type: "uint256",
        indexed: true
      },
      {
        name: "_ruling",
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
        name: "_reward",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Withdrawal"
  },
  {
    type: "function",
    inputs: [],
    name: "LOSER_APPEAL_PERIOD_MULTIPLIER",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "LOSER_STAKE_MULTIPLIER",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "MULTIPLIER_DENOMINATOR",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "WINNER_STAKE_MULTIPLIER",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "arbitrationRequests",
    outputs: [
      {
        name: "status",
        internalType: "enum RealitioArbitratorWithAppealsBase.Status",
        type: "uint8"
      },
      { name: "requester", internalType: "address", type: "address" },
      { name: "disputeID", internalType: "uint256", type: "uint256" },
      { name: "ruling", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitrator",
    outputs: [
      { name: "", internalType: "contract IArbitrator", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "arbitratorExtraData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "externalIDtoLocalID",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "uint256", type: "uint256" },
      { name: "_ruling", internalType: "uint256", type: "uint256" }
    ],
    name: "fundAppeal",
    outputs: [{ name: "fullyFunded", internalType: "bool", type: "bool" }],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "getDisputeFee",
    outputs: [{ name: "fee", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "getMultipliers",
    outputs: [
      {
        name: "_WINNER_STAKE_MULTIPLIER",
        internalType: "uint256",
        type: "uint256"
      },
      {
        name: "_LOSER_STAKE_MULTIPLIER",
        internalType: "uint256",
        type: "uint256"
      },
      {
        name: "_LOSER_APPEAL_PERIOD_MULTIPLIER",
        internalType: "uint256",
        type: "uint256"
      },
      { name: "_DENOMINATOR", internalType: "uint256", type: "uint256" }
    ],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "uint256", type: "uint256" },
      {
        name: "_contributor",
        internalType: "address payable",
        type: "address"
      },
      { name: "_ruling", internalType: "uint256", type: "uint256" }
    ],
    name: "getTotalWithdrawableAmount",
    outputs: [{ name: "sum", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "metadata",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "numberOfRulingOptions",
    outputs: [{ name: "count", internalType: "uint256", type: "uint256" }],
    stateMutability: "pure"
  },
  {
    type: "function",
    inputs: [],
    name: "realitio",
    outputs: [
      { name: "", internalType: "contract IRealitio", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_lastHistoryHash", internalType: "bytes32", type: "bytes32" },
      {
        name: "_lastAnswerOrCommitmentID",
        internalType: "bytes32",
        type: "bytes32"
      },
      { name: "_lastAnswerer", internalType: "address", type: "address" }
    ],
    name: "reportAnswer",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "bytes32", type: "bytes32" },
      { name: "_maxPrevious", internalType: "uint256", type: "uint256" }
    ],
    name: "requestArbitration",
    outputs: [{ name: "disputeID", internalType: "uint256", type: "uint256" }],
    stateMutability: "payable"
  },
  {
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
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "uint256", type: "uint256" },
      { name: "_evidenceURI", internalType: "string", type: "string" }
    ],
    name: "submitEvidence",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "uint256", type: "uint256" },
      {
        name: "_contributor",
        internalType: "address payable",
        type: "address"
      },
      { name: "_roundNumber", internalType: "uint256", type: "uint256" },
      { name: "_ruling", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewards",
    outputs: [{ name: "amount", internalType: "uint256", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_questionID", internalType: "uint256", type: "uint256" },
      {
        name: "_contributor",
        internalType: "address payable",
        type: "address"
      },
      { name: "_ruling", internalType: "uint256", type: "uint256" }
    ],
    name: "withdrawFeesAndRewardsForAllRounds",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var realitioV2_1ArbitratorWithAppealsAddress = {
  1: "0x2018038203aEE8e7a29dABd73771b0355D4F85ad",
  11155111: "0xa638F22cDD13013494971b0e1325718AA45280dc"
};
var realitioV2_1ArbitratorWithAppealsConfig = {
  address: realitioV2_1ArbitratorWithAppealsAddress,
  abi: realitioV2_1ArbitratorWithAppealsAbi
};
var useReadRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var useReadRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "META_EVIDENCE_ID"
});
var useReadRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var useReadRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var useReadRealitioForeignArbitrationProxyWithAppealsVersion = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "VERSION"
});
var useReadRealitioForeignArbitrationProxyWithAppealsAmb = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "amb"
});
var useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationIDToRequester"
});
var useReadRealitioForeignArbitrationProxyWithAppealsArbitrationRequests = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationRequests"
});
var useReadRealitioForeignArbitrationProxyWithAppealsArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrator"
});
var useReadRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitratorExtraData"
});
var useReadRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "disputeIDToDisputeDetails"
});
var useReadRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "externalIDtoLocalID"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetDisputeFee = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getDisputeFee"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetFundingStatus = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getFundingStatus"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetMultipliers = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getMultipliers"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getNumberOfRounds"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetRoundInfo = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getRoundInfo"
});
var useReadRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getTotalWithdrawableAmount"
});
var useReadRealitioForeignArbitrationProxyWithAppealsHomeChainId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "homeChainId"
});
var useReadRealitioForeignArbitrationProxyWithAppealsHomeProxy = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "homeProxy"
});
var useReadRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var useReadRealitioForeignArbitrationProxyWithAppealsLoserMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "loserMultiplier"
});
var useReadRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "numberOfRulingOptions"
});
var useReadRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "questionIDToArbitrationID"
});
var useReadRealitioForeignArbitrationProxyWithAppealsTermsOfService = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "termsOfService"
});
var useReadRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "winnerMultiplier"
});
var useWriteRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var useWriteRealitioForeignArbitrationProxyWithAppealsFundAppeal = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "fundAppeal"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "handleFailedDisputeCreation"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationCancelation"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsRequestArbitration = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "requestArbitration"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "rule"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsSubmitEvidence = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "submitEvidence"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useSimulateRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsFundAppeal = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "fundAppeal"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "handleFailedDisputeCreation"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationCancelation"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "requestArbitration"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "rule"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "submitEvidence"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationCanceled"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationCreated"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationFailed"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationRequested"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsContributionEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Contribution"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsDisputeEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Dispute"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Evidence"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "MetaEvidence"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsRulingEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Ruling"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "RulingFunded"
});
var useWatchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Withdrawal"
});
var useReadRealitioForeignProxyBase = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var useReadRealitioForeignProxyBaseMetaEvidenceId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "META_EVIDENCE_ID"
});
var useReadRealitioForeignProxyBaseMinGasLimit = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "MIN_GAS_LIMIT"
});
var useReadRealitioForeignProxyBaseMultiplierDivisor = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var useReadRealitioForeignProxyBaseNumberOfChoicesForArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var useReadRealitioForeignProxyBaseRefuseToArbitrateRealitio = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "REFUSE_TO_ARBITRATE_REALITIO"
});
var useReadRealitioForeignProxyBaseVersion = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "VERSION"
});
var useReadRealitioForeignProxyBaseArbitrationCreatedBlock = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationCreatedBlock"
});
var useReadRealitioForeignProxyBaseArbitrationIdToDisputeExists = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var useReadRealitioForeignProxyBaseArbitrationIdToRequester = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationIDToRequester"
});
var useReadRealitioForeignProxyBaseArbitrationRequests = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationRequests"
});
var useReadRealitioForeignProxyBaseArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrator"
});
var useReadRealitioForeignProxyBaseArbitratorExtraData = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitratorExtraData"
});
var useReadRealitioForeignProxyBaseDisputeIdToDisputeDetails = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "disputeIDToDisputeDetails"
});
var useReadRealitioForeignProxyBaseExternalIDtoLocalId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "externalIDtoLocalID"
});
var useReadRealitioForeignProxyBaseGetContributionsToSuccessfulFundings = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var useReadRealitioForeignProxyBaseGetDisputeFee = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getDisputeFee"
});
var useReadRealitioForeignProxyBaseGetFundingStatus = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getFundingStatus"
});
var useReadRealitioForeignProxyBaseGetMultipliers = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getMultipliers"
});
var useReadRealitioForeignProxyBaseGetNumberOfRounds = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getNumberOfRounds"
});
var useReadRealitioForeignProxyBaseGetRoundInfo = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getRoundInfo"
});
var useReadRealitioForeignProxyBaseGetTotalWithdrawableAmount = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getTotalWithdrawableAmount"
});
var useReadRealitioForeignProxyBaseHomeProxy = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "homeProxy"
});
var useReadRealitioForeignProxyBaseLoserAppealPeriodMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var useReadRealitioForeignProxyBaseLoserMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "loserMultiplier"
});
var useReadRealitioForeignProxyBaseMessenger = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "messenger"
});
var useReadRealitioForeignProxyBaseNumberOfRulingOptions = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "numberOfRulingOptions"
});
var useReadRealitioForeignProxyBaseQuestionIdToArbitrationId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "questionIDToArbitrationID"
});
var useReadRealitioForeignProxyBaseWNative = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "wNative"
});
var useReadRealitioForeignProxyBaseWinnerMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "winnerMultiplier"
});
var useWriteRealitioForeignProxyBase = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var useWriteRealitioForeignProxyBaseFundAppeal = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "fundAppeal"
});
var useWriteRealitioForeignProxyBaseHandleFailedDisputeCreation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreation"
});
var useWriteRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var useWriteRealitioForeignProxyBaseReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useWriteRealitioForeignProxyBaseReceiveArbitrationCancelation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationCancelation"
});
var useWriteRealitioForeignProxyBaseRelayRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRule"
});
var useWriteRealitioForeignProxyBaseRelayRuleCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRuleCustomParameters"
});
var useWriteRealitioForeignProxyBaseRequestArbitration = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitration"
});
var useWriteRealitioForeignProxyBaseRequestArbitrationCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitrationCustomParameters"
});
var useWriteRealitioForeignProxyBaseRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "rule"
});
var useWriteRealitioForeignProxyBaseSubmitEvidence = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "submitEvidence"
});
var useWriteRealitioForeignProxyBaseWithdrawFeesAndRewards = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewards"
});
var useWriteRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useSimulateRealitioForeignProxyBase = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var useSimulateRealitioForeignProxyBaseFundAppeal = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "fundAppeal"
});
var useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreation"
});
var useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var useSimulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useSimulateRealitioForeignProxyBaseReceiveArbitrationCancelation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationCancelation"
});
var useSimulateRealitioForeignProxyBaseRelayRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRule"
});
var useSimulateRealitioForeignProxyBaseRelayRuleCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRuleCustomParameters"
});
var useSimulateRealitioForeignProxyBaseRequestArbitration = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitration"
});
var useSimulateRealitioForeignProxyBaseRequestArbitrationCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitrationCustomParameters"
});
var useSimulateRealitioForeignProxyBaseRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "rule"
});
var useSimulateRealitioForeignProxyBaseSubmitEvidence = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "submitEvidence"
});
var useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewards = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewards"
});
var useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useWatchRealitioForeignProxyBaseEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var useWatchRealitioForeignProxyBaseArbitrationCanceledEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationCanceled"
});
var useWatchRealitioForeignProxyBaseArbitrationCreatedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationCreated"
});
var useWatchRealitioForeignProxyBaseArbitrationFailedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationFailed"
});
var useWatchRealitioForeignProxyBaseArbitrationRequestedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationRequested"
});
var useWatchRealitioForeignProxyBaseContributionEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Contribution"
});
var useWatchRealitioForeignProxyBaseDisputeEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Dispute"
});
var useWatchRealitioForeignProxyBaseEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Evidence"
});
var useWatchRealitioForeignProxyBaseMetaEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "MetaEvidence"
});
var useWatchRealitioForeignProxyBaseRulingEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Ruling"
});
var useWatchRealitioForeignProxyBaseRulingFundedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "RulingFunded"
});
var useWatchRealitioForeignProxyBaseRulingRelayedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "RulingRelayed"
});
var useWatchRealitioForeignProxyBaseWithdrawalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Withdrawal"
});
var useReadRealitioForeignProxyOptimism = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var useReadRealitioForeignProxyOptimismMetaEvidenceId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "META_EVIDENCE_ID"
});
var useReadRealitioForeignProxyOptimismMinGasLimit = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "MIN_GAS_LIMIT"
});
var useReadRealitioForeignProxyOptimismMultiplierDivisor = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var useReadRealitioForeignProxyOptimismNumberOfChoicesForArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var useReadRealitioForeignProxyOptimismRefuseToArbitrateRealitio = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "REFUSE_TO_ARBITRATE_REALITIO"
});
var useReadRealitioForeignProxyOptimismVersion = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "VERSION"
});
var useReadRealitioForeignProxyOptimismArbitrationCreatedBlock = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationCreatedBlock"
});
var useReadRealitioForeignProxyOptimismArbitrationIdToDisputeExists = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var useReadRealitioForeignProxyOptimismArbitrationIdToRequester = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationIDToRequester"
});
var useReadRealitioForeignProxyOptimismArbitrationRequests = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationRequests"
});
var useReadRealitioForeignProxyOptimismArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrator"
});
var useReadRealitioForeignProxyOptimismArbitratorExtraData = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitratorExtraData"
});
var useReadRealitioForeignProxyOptimismDisputeIdToDisputeDetails = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "disputeIDToDisputeDetails"
});
var useReadRealitioForeignProxyOptimismExternalIDtoLocalId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "externalIDtoLocalID"
});
var useReadRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var useReadRealitioForeignProxyOptimismGetDisputeFee = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getDisputeFee"
});
var useReadRealitioForeignProxyOptimismGetFundingStatus = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getFundingStatus"
});
var useReadRealitioForeignProxyOptimismGetMultipliers = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getMultipliers"
});
var useReadRealitioForeignProxyOptimismGetNumberOfRounds = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getNumberOfRounds"
});
var useReadRealitioForeignProxyOptimismGetRoundInfo = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getRoundInfo"
});
var useReadRealitioForeignProxyOptimismGetTotalWithdrawableAmount = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getTotalWithdrawableAmount"
});
var useReadRealitioForeignProxyOptimismHomeProxy = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "homeProxy"
});
var useReadRealitioForeignProxyOptimismLoserAppealPeriodMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var useReadRealitioForeignProxyOptimismLoserMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "loserMultiplier"
});
var useReadRealitioForeignProxyOptimismMessenger = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "messenger"
});
var useReadRealitioForeignProxyOptimismNumberOfRulingOptions = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "numberOfRulingOptions"
});
var useReadRealitioForeignProxyOptimismQuestionIdToArbitrationId = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "questionIDToArbitrationID"
});
var useReadRealitioForeignProxyOptimismWNative = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "wNative"
});
var useReadRealitioForeignProxyOptimismWinnerMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "winnerMultiplier"
});
var useWriteRealitioForeignProxyOptimism = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var useWriteRealitioForeignProxyOptimismFundAppeal = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "fundAppeal"
});
var useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreation"
});
var useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var useWriteRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useWriteRealitioForeignProxyOptimismReceiveArbitrationCancelation = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationCancelation"
});
var useWriteRealitioForeignProxyOptimismRelayRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRule"
});
var useWriteRealitioForeignProxyOptimismRelayRuleCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRuleCustomParameters"
});
var useWriteRealitioForeignProxyOptimismRequestArbitration = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitration"
});
var useWriteRealitioForeignProxyOptimismRequestArbitrationCustomParameters = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitrationCustomParameters"
});
var useWriteRealitioForeignProxyOptimismRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "rule"
});
var useWriteRealitioForeignProxyOptimismSubmitEvidence = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "submitEvidence"
});
var useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewards = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewards"
});
var useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useSimulateRealitioForeignProxyOptimism = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var useSimulateRealitioForeignProxyOptimismFundAppeal = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "fundAppeal"
});
var useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreation"
});
var useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var useSimulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var useSimulateRealitioForeignProxyOptimismReceiveArbitrationCancelation = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationCancelation"
});
var useSimulateRealitioForeignProxyOptimismRelayRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRule"
});
var useSimulateRealitioForeignProxyOptimismRelayRuleCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRuleCustomParameters"
});
var useSimulateRealitioForeignProxyOptimismRequestArbitration = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitration"
});
var useSimulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitrationCustomParameters"
});
var useSimulateRealitioForeignProxyOptimismRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "rule"
});
var useSimulateRealitioForeignProxyOptimismSubmitEvidence = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "submitEvidence"
});
var useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewards = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewards"
});
var useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useWatchRealitioForeignProxyOptimismEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var useWatchRealitioForeignProxyOptimismArbitrationCanceledEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationCanceled"
});
var useWatchRealitioForeignProxyOptimismArbitrationCreatedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationCreated"
});
var useWatchRealitioForeignProxyOptimismArbitrationFailedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationFailed"
});
var useWatchRealitioForeignProxyOptimismArbitrationRequestedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationRequested"
});
var useWatchRealitioForeignProxyOptimismContributionEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Contribution"
});
var useWatchRealitioForeignProxyOptimismDisputeEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Dispute"
});
var useWatchRealitioForeignProxyOptimismEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Evidence"
});
var useWatchRealitioForeignProxyOptimismMetaEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "MetaEvidence"
});
var useWatchRealitioForeignProxyOptimismRulingEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Ruling"
});
var useWatchRealitioForeignProxyOptimismRulingFundedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "RulingFunded"
});
var useWatchRealitioForeignProxyOptimismRulingRelayedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "RulingRelayed"
});
var useWatchRealitioForeignProxyOptimismWithdrawalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Withdrawal"
});
var useReadRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var useReadRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "LOSER_APPEAL_PERIOD_MULTIPLIER"
});
var useReadRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "LOSER_STAKE_MULTIPLIER"
});
var useReadRealitioV2_1ArbitratorWithAppealsMultiplierDenominator = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "MULTIPLIER_DENOMINATOR"
});
var useReadRealitioV2_1ArbitratorWithAppealsVersion = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "VERSION"
});
var useReadRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "WINNER_STAKE_MULTIPLIER"
});
var useReadRealitioV2_1ArbitratorWithAppealsArbitrationRequests = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitrationRequests"
});
var useReadRealitioV2_1ArbitratorWithAppealsArbitrator = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitrator"
});
var useReadRealitioV2_1ArbitratorWithAppealsArbitratorExtraData = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitratorExtraData"
});
var useReadRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "externalIDtoLocalID"
});
var useReadRealitioV2_1ArbitratorWithAppealsGetDisputeFee = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getDisputeFee"
});
var useReadRealitioV2_1ArbitratorWithAppealsGetMultipliers = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getMultipliers"
});
var useReadRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getTotalWithdrawableAmount"
});
var useReadRealitioV2_1ArbitratorWithAppealsMetadata = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "metadata"
});
var useReadRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "numberOfRulingOptions"
});
var useReadRealitioV2_1ArbitratorWithAppealsRealitio = /* @__PURE__ */ createUseReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "realitio"
});
var useWriteRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var useWriteRealitioV2_1ArbitratorWithAppealsFundAppeal = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "fundAppeal"
});
var useWriteRealitioV2_1ArbitratorWithAppealsReportAnswer = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "reportAnswer"
});
var useWriteRealitioV2_1ArbitratorWithAppealsRequestArbitration = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "requestArbitration"
});
var useWriteRealitioV2_1ArbitratorWithAppealsRule = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "rule"
});
var useWriteRealitioV2_1ArbitratorWithAppealsSubmitEvidence = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "submitEvidence"
});
var useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useSimulateRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var useSimulateRealitioV2_1ArbitratorWithAppealsFundAppeal = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "fundAppeal"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsReportAnswer = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "reportAnswer"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsRequestArbitration = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "requestArbitration"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsRule = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "rule"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "submitEvidence"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createUseSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var useWatchRealitioV2_1ArbitratorWithAppealsEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var useWatchRealitioV2_1ArbitratorWithAppealsContributionEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Contribution"
});
var useWatchRealitioV2_1ArbitratorWithAppealsDisputeEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Dispute"
});
var useWatchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "DisputeIDToQuestionID"
});
var useWatchRealitioV2_1ArbitratorWithAppealsEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Evidence"
});
var useWatchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "MetaEvidence"
});
var useWatchRealitioV2_1ArbitratorWithAppealsRulingEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Ruling"
});
var useWatchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "RulingFunded"
});
var useWatchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Withdrawal"
});
var readRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var readRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "META_EVIDENCE_ID"
});
var readRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var readRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var readRealitioForeignArbitrationProxyWithAppealsVersion = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "VERSION"
});
var readRealitioForeignArbitrationProxyWithAppealsAmb = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "amb"
});
var readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationIDToRequester"
});
var readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrationRequests"
});
var readRealitioForeignArbitrationProxyWithAppealsArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitrator"
});
var readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "arbitratorExtraData"
});
var readRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "disputeIDToDisputeDetails"
});
var readRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "externalIDtoLocalID"
});
var readRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var readRealitioForeignArbitrationProxyWithAppealsGetDisputeFee = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getDisputeFee"
});
var readRealitioForeignArbitrationProxyWithAppealsGetFundingStatus = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getFundingStatus"
});
var readRealitioForeignArbitrationProxyWithAppealsGetMultipliers = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getMultipliers"
});
var readRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getNumberOfRounds"
});
var readRealitioForeignArbitrationProxyWithAppealsGetRoundInfo = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getRoundInfo"
});
var readRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "getTotalWithdrawableAmount"
});
var readRealitioForeignArbitrationProxyWithAppealsHomeChainId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "homeChainId"
});
var readRealitioForeignArbitrationProxyWithAppealsHomeProxy = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "homeProxy"
});
var readRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var readRealitioForeignArbitrationProxyWithAppealsLoserMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "loserMultiplier"
});
var readRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "numberOfRulingOptions"
});
var readRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "questionIDToArbitrationID"
});
var readRealitioForeignArbitrationProxyWithAppealsTermsOfService = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "termsOfService"
});
var readRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "winnerMultiplier"
});
var writeRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var writeRealitioForeignArbitrationProxyWithAppealsFundAppeal = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "fundAppeal"
});
var writeRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "handleFailedDisputeCreation"
});
var writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationCancelation"
});
var writeRealitioForeignArbitrationProxyWithAppealsRequestArbitration = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "requestArbitration"
});
var writeRealitioForeignArbitrationProxyWithAppealsRule = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "rule"
});
var writeRealitioForeignArbitrationProxyWithAppealsSubmitEvidence = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "submitEvidence"
});
var writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var simulateRealitioForeignArbitrationProxyWithAppeals = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var simulateRealitioForeignArbitrationProxyWithAppealsFundAppeal = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "fundAppeal"
});
var simulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "handleFailedDisputeCreation"
});
var simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "receiveArbitrationCancelation"
});
var simulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "requestArbitration"
});
var simulateRealitioForeignArbitrationProxyWithAppealsRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "rule"
});
var simulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "submitEvidence"
});
var simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var watchRealitioForeignArbitrationProxyWithAppealsEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress
});
var watchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationCanceled"
});
var watchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationCreated"
});
var watchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationFailed"
});
var watchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "ArbitrationRequested"
});
var watchRealitioForeignArbitrationProxyWithAppealsContributionEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Contribution"
});
var watchRealitioForeignArbitrationProxyWithAppealsDisputeEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Dispute"
});
var watchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Evidence"
});
var watchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "MetaEvidence"
});
var watchRealitioForeignArbitrationProxyWithAppealsRulingEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Ruling"
});
var watchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "RulingFunded"
});
var watchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignArbitrationProxyWithAppealsAbi,
  address: realitioForeignArbitrationProxyWithAppealsAddress,
  eventName: "Withdrawal"
});
var readRealitioForeignProxyBase = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var readRealitioForeignProxyBaseMetaEvidenceId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "META_EVIDENCE_ID"
});
var readRealitioForeignProxyBaseMinGasLimit = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "MIN_GAS_LIMIT"
});
var readRealitioForeignProxyBaseMultiplierDivisor = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var readRealitioForeignProxyBaseNumberOfChoicesForArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var readRealitioForeignProxyBaseRefuseToArbitrateRealitio = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "REFUSE_TO_ARBITRATE_REALITIO"
});
var readRealitioForeignProxyBaseVersion = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "VERSION"
});
var readRealitioForeignProxyBaseArbitrationCreatedBlock = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationCreatedBlock"
});
var readRealitioForeignProxyBaseArbitrationIdToDisputeExists = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var readRealitioForeignProxyBaseArbitrationIdToRequester = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationIDToRequester"
});
var readRealitioForeignProxyBaseArbitrationRequests = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrationRequests"
});
var readRealitioForeignProxyBaseArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitrator"
});
var readRealitioForeignProxyBaseArbitratorExtraData = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "arbitratorExtraData"
});
var readRealitioForeignProxyBaseDisputeIdToDisputeDetails = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "disputeIDToDisputeDetails"
});
var readRealitioForeignProxyBaseExternalIDtoLocalId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "externalIDtoLocalID"
});
var readRealitioForeignProxyBaseGetContributionsToSuccessfulFundings = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var readRealitioForeignProxyBaseGetDisputeFee = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getDisputeFee"
});
var readRealitioForeignProxyBaseGetFundingStatus = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getFundingStatus"
});
var readRealitioForeignProxyBaseGetMultipliers = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getMultipliers"
});
var readRealitioForeignProxyBaseGetNumberOfRounds = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getNumberOfRounds"
});
var readRealitioForeignProxyBaseGetRoundInfo = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getRoundInfo"
});
var readRealitioForeignProxyBaseGetTotalWithdrawableAmount = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "getTotalWithdrawableAmount"
});
var readRealitioForeignProxyBaseHomeProxy = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "homeProxy"
});
var readRealitioForeignProxyBaseLoserAppealPeriodMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var readRealitioForeignProxyBaseLoserMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "loserMultiplier"
});
var readRealitioForeignProxyBaseMessenger = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "messenger"
});
var readRealitioForeignProxyBaseNumberOfRulingOptions = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "numberOfRulingOptions"
});
var readRealitioForeignProxyBaseQuestionIdToArbitrationId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "questionIDToArbitrationID"
});
var readRealitioForeignProxyBaseWNative = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "wNative"
});
var readRealitioForeignProxyBaseWinnerMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "winnerMultiplier"
});
var writeRealitioForeignProxyBase = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var writeRealitioForeignProxyBaseFundAppeal = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "fundAppeal"
});
var writeRealitioForeignProxyBaseHandleFailedDisputeCreation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreation"
});
var writeRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var writeRealitioForeignProxyBaseReceiveArbitrationAcknowledgement = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var writeRealitioForeignProxyBaseReceiveArbitrationCancelation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationCancelation"
});
var writeRealitioForeignProxyBaseRelayRule = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRule"
});
var writeRealitioForeignProxyBaseRelayRuleCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRuleCustomParameters"
});
var writeRealitioForeignProxyBaseRequestArbitration = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitration"
});
var writeRealitioForeignProxyBaseRequestArbitrationCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitrationCustomParameters"
});
var writeRealitioForeignProxyBaseRule = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "rule"
});
var writeRealitioForeignProxyBaseSubmitEvidence = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "submitEvidence"
});
var writeRealitioForeignProxyBaseWithdrawFeesAndRewards = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewards"
});
var writeRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var simulateRealitioForeignProxyBase = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var simulateRealitioForeignProxyBaseFundAppeal = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "fundAppeal"
});
var simulateRealitioForeignProxyBaseHandleFailedDisputeCreation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreation"
});
var simulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var simulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var simulateRealitioForeignProxyBaseReceiveArbitrationCancelation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "receiveArbitrationCancelation"
});
var simulateRealitioForeignProxyBaseRelayRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRule"
});
var simulateRealitioForeignProxyBaseRelayRuleCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "relayRuleCustomParameters"
});
var simulateRealitioForeignProxyBaseRequestArbitration = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitration"
});
var simulateRealitioForeignProxyBaseRequestArbitrationCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "requestArbitrationCustomParameters"
});
var simulateRealitioForeignProxyBaseRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "rule"
});
var simulateRealitioForeignProxyBaseSubmitEvidence = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "submitEvidence"
});
var simulateRealitioForeignProxyBaseWithdrawFeesAndRewards = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewards"
});
var simulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var watchRealitioForeignProxyBaseEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress
});
var watchRealitioForeignProxyBaseArbitrationCanceledEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationCanceled"
});
var watchRealitioForeignProxyBaseArbitrationCreatedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationCreated"
});
var watchRealitioForeignProxyBaseArbitrationFailedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationFailed"
});
var watchRealitioForeignProxyBaseArbitrationRequestedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "ArbitrationRequested"
});
var watchRealitioForeignProxyBaseContributionEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Contribution"
});
var watchRealitioForeignProxyBaseDisputeEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Dispute"
});
var watchRealitioForeignProxyBaseEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Evidence"
});
var watchRealitioForeignProxyBaseMetaEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "MetaEvidence"
});
var watchRealitioForeignProxyBaseRulingEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Ruling"
});
var watchRealitioForeignProxyBaseRulingFundedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "RulingFunded"
});
var watchRealitioForeignProxyBaseRulingRelayedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "RulingRelayed"
});
var watchRealitioForeignProxyBaseWithdrawalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyBaseAbi,
  address: realitioForeignProxyBaseAddress,
  eventName: "Withdrawal"
});
var readRealitioForeignProxyOptimism = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var readRealitioForeignProxyOptimismMetaEvidenceId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "META_EVIDENCE_ID"
});
var readRealitioForeignProxyOptimismMinGasLimit = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "MIN_GAS_LIMIT"
});
var readRealitioForeignProxyOptimismMultiplierDivisor = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "MULTIPLIER_DIVISOR"
});
var readRealitioForeignProxyOptimismNumberOfChoicesForArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "NUMBER_OF_CHOICES_FOR_ARBITRATOR"
});
var readRealitioForeignProxyOptimismRefuseToArbitrateRealitio = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "REFUSE_TO_ARBITRATE_REALITIO"
});
var readRealitioForeignProxyOptimismVersion = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "VERSION"
});
var readRealitioForeignProxyOptimismArbitrationCreatedBlock = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationCreatedBlock"
});
var readRealitioForeignProxyOptimismArbitrationIdToDisputeExists = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationIDToDisputeExists"
});
var readRealitioForeignProxyOptimismArbitrationIdToRequester = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationIDToRequester"
});
var readRealitioForeignProxyOptimismArbitrationRequests = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrationRequests"
});
var readRealitioForeignProxyOptimismArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitrator"
});
var readRealitioForeignProxyOptimismArbitratorExtraData = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "arbitratorExtraData"
});
var readRealitioForeignProxyOptimismDisputeIdToDisputeDetails = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "disputeIDToDisputeDetails"
});
var readRealitioForeignProxyOptimismExternalIDtoLocalId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "externalIDtoLocalID"
});
var readRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getContributionsToSuccessfulFundings"
});
var readRealitioForeignProxyOptimismGetDisputeFee = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getDisputeFee"
});
var readRealitioForeignProxyOptimismGetFundingStatus = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getFundingStatus"
});
var readRealitioForeignProxyOptimismGetMultipliers = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getMultipliers"
});
var readRealitioForeignProxyOptimismGetNumberOfRounds = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getNumberOfRounds"
});
var readRealitioForeignProxyOptimismGetRoundInfo = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getRoundInfo"
});
var readRealitioForeignProxyOptimismGetTotalWithdrawableAmount = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "getTotalWithdrawableAmount"
});
var readRealitioForeignProxyOptimismHomeProxy = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "homeProxy"
});
var readRealitioForeignProxyOptimismLoserAppealPeriodMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "loserAppealPeriodMultiplier"
});
var readRealitioForeignProxyOptimismLoserMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "loserMultiplier"
});
var readRealitioForeignProxyOptimismMessenger = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "messenger"
});
var readRealitioForeignProxyOptimismNumberOfRulingOptions = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "numberOfRulingOptions"
});
var readRealitioForeignProxyOptimismQuestionIdToArbitrationId = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "questionIDToArbitrationID"
});
var readRealitioForeignProxyOptimismWNative = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "wNative"
});
var readRealitioForeignProxyOptimismWinnerMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "winnerMultiplier"
});
var writeRealitioForeignProxyOptimism = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var writeRealitioForeignProxyOptimismFundAppeal = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "fundAppeal"
});
var writeRealitioForeignProxyOptimismHandleFailedDisputeCreation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreation"
});
var writeRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var writeRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var writeRealitioForeignProxyOptimismReceiveArbitrationCancelation = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationCancelation"
});
var writeRealitioForeignProxyOptimismRelayRule = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRule"
});
var writeRealitioForeignProxyOptimismRelayRuleCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRuleCustomParameters"
});
var writeRealitioForeignProxyOptimismRequestArbitration = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitration"
});
var writeRealitioForeignProxyOptimismRequestArbitrationCustomParameters = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitrationCustomParameters"
});
var writeRealitioForeignProxyOptimismRule = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "rule"
});
var writeRealitioForeignProxyOptimismSubmitEvidence = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "submitEvidence"
});
var writeRealitioForeignProxyOptimismWithdrawFeesAndRewards = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewards"
});
var writeRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createWriteContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var simulateRealitioForeignProxyOptimism = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var simulateRealitioForeignProxyOptimismFundAppeal = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "fundAppeal"
});
var simulateRealitioForeignProxyOptimismHandleFailedDisputeCreation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreation"
});
var simulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "handleFailedDisputeCreationCustomParameters"
});
var simulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationAcknowledgement"
});
var simulateRealitioForeignProxyOptimismReceiveArbitrationCancelation = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "receiveArbitrationCancelation"
});
var simulateRealitioForeignProxyOptimismRelayRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRule"
});
var simulateRealitioForeignProxyOptimismRelayRuleCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "relayRuleCustomParameters"
});
var simulateRealitioForeignProxyOptimismRequestArbitration = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitration"
});
var simulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "requestArbitrationCustomParameters"
});
var simulateRealitioForeignProxyOptimismRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "rule"
});
var simulateRealitioForeignProxyOptimismSubmitEvidence = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "submitEvidence"
});
var simulateRealitioForeignProxyOptimismWithdrawFeesAndRewards = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewards"
});
var simulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createSimulateContract({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var watchRealitioForeignProxyOptimismEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress
});
var watchRealitioForeignProxyOptimismArbitrationCanceledEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationCanceled"
});
var watchRealitioForeignProxyOptimismArbitrationCreatedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationCreated"
});
var watchRealitioForeignProxyOptimismArbitrationFailedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationFailed"
});
var watchRealitioForeignProxyOptimismArbitrationRequestedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "ArbitrationRequested"
});
var watchRealitioForeignProxyOptimismContributionEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Contribution"
});
var watchRealitioForeignProxyOptimismDisputeEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Dispute"
});
var watchRealitioForeignProxyOptimismEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Evidence"
});
var watchRealitioForeignProxyOptimismMetaEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "MetaEvidence"
});
var watchRealitioForeignProxyOptimismRulingEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Ruling"
});
var watchRealitioForeignProxyOptimismRulingFundedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "RulingFunded"
});
var watchRealitioForeignProxyOptimismRulingRelayedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "RulingRelayed"
});
var watchRealitioForeignProxyOptimismWithdrawalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioForeignProxyOptimismAbi,
  address: realitioForeignProxyOptimismAddress,
  eventName: "Withdrawal"
});
var readRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var readRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "LOSER_APPEAL_PERIOD_MULTIPLIER"
});
var readRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "LOSER_STAKE_MULTIPLIER"
});
var readRealitioV2_1ArbitratorWithAppealsMultiplierDenominator = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "MULTIPLIER_DENOMINATOR"
});
var readRealitioV2_1ArbitratorWithAppealsVersion = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "VERSION"
});
var readRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "WINNER_STAKE_MULTIPLIER"
});
var readRealitioV2_1ArbitratorWithAppealsArbitrationRequests = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitrationRequests"
});
var readRealitioV2_1ArbitratorWithAppealsArbitrator = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitrator"
});
var readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "arbitratorExtraData"
});
var readRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "externalIDtoLocalID"
});
var readRealitioV2_1ArbitratorWithAppealsGetDisputeFee = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getDisputeFee"
});
var readRealitioV2_1ArbitratorWithAppealsGetMultipliers = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getMultipliers"
});
var readRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "getTotalWithdrawableAmount"
});
var readRealitioV2_1ArbitratorWithAppealsMetadata = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "metadata"
});
var readRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "numberOfRulingOptions"
});
var readRealitioV2_1ArbitratorWithAppealsRealitio = /* @__PURE__ */ createReadContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "realitio"
});
var writeRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var writeRealitioV2_1ArbitratorWithAppealsFundAppeal = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "fundAppeal"
});
var writeRealitioV2_1ArbitratorWithAppealsReportAnswer = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "reportAnswer"
});
var writeRealitioV2_1ArbitratorWithAppealsRequestArbitration = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "requestArbitration"
});
var writeRealitioV2_1ArbitratorWithAppealsRule = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "rule"
});
var writeRealitioV2_1ArbitratorWithAppealsSubmitEvidence = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "submitEvidence"
});
var writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createWriteContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var simulateRealitioV2_1ArbitratorWithAppeals = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var simulateRealitioV2_1ArbitratorWithAppealsFundAppeal = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "fundAppeal"
});
var simulateRealitioV2_1ArbitratorWithAppealsReportAnswer = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "reportAnswer"
});
var simulateRealitioV2_1ArbitratorWithAppealsRequestArbitration = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "requestArbitration"
});
var simulateRealitioV2_1ArbitratorWithAppealsRule = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "rule"
});
var simulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "submitEvidence"
});
var simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewards"
});
var simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds = /* @__PURE__ */ createSimulateContract({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  functionName: "withdrawFeesAndRewardsForAllRounds"
});
var watchRealitioV2_1ArbitratorWithAppealsEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress
});
var watchRealitioV2_1ArbitratorWithAppealsContributionEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Contribution"
});
var watchRealitioV2_1ArbitratorWithAppealsDisputeEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Dispute"
});
var watchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "DisputeIDToQuestionID"
});
var watchRealitioV2_1ArbitratorWithAppealsEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Evidence"
});
var watchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "MetaEvidence"
});
var watchRealitioV2_1ArbitratorWithAppealsRulingEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Ruling"
});
var watchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "RulingFunded"
});
var watchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: realitioV2_1ArbitratorWithAppealsAbi,
  address: realitioV2_1ArbitratorWithAppealsAddress,
  eventName: "Withdrawal"
});
export {
  readRealitioForeignArbitrationProxyWithAppeals,
  readRealitioForeignArbitrationProxyWithAppealsAmb,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
  readRealitioForeignArbitrationProxyWithAppealsArbitrator,
  readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData,
  readRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails,
  readRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId,
  readRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings,
  readRealitioForeignArbitrationProxyWithAppealsGetDisputeFee,
  readRealitioForeignArbitrationProxyWithAppealsGetFundingStatus,
  readRealitioForeignArbitrationProxyWithAppealsGetMultipliers,
  readRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds,
  readRealitioForeignArbitrationProxyWithAppealsGetRoundInfo,
  readRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount,
  readRealitioForeignArbitrationProxyWithAppealsHomeChainId,
  readRealitioForeignArbitrationProxyWithAppealsHomeProxy,
  readRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier,
  readRealitioForeignArbitrationProxyWithAppealsLoserMultiplier,
  readRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId,
  readRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor,
  readRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator,
  readRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions,
  readRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId,
  readRealitioForeignArbitrationProxyWithAppealsTermsOfService,
  readRealitioForeignArbitrationProxyWithAppealsVersion,
  readRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier,
  readRealitioForeignProxyBase,
  readRealitioForeignProxyBaseArbitrationCreatedBlock,
  readRealitioForeignProxyBaseArbitrationIdToDisputeExists,
  readRealitioForeignProxyBaseArbitrationIdToRequester,
  readRealitioForeignProxyBaseArbitrationRequests,
  readRealitioForeignProxyBaseArbitrator,
  readRealitioForeignProxyBaseArbitratorExtraData,
  readRealitioForeignProxyBaseDisputeIdToDisputeDetails,
  readRealitioForeignProxyBaseExternalIDtoLocalId,
  readRealitioForeignProxyBaseGetContributionsToSuccessfulFundings,
  readRealitioForeignProxyBaseGetDisputeFee,
  readRealitioForeignProxyBaseGetFundingStatus,
  readRealitioForeignProxyBaseGetMultipliers,
  readRealitioForeignProxyBaseGetNumberOfRounds,
  readRealitioForeignProxyBaseGetRoundInfo,
  readRealitioForeignProxyBaseGetTotalWithdrawableAmount,
  readRealitioForeignProxyBaseHomeProxy,
  readRealitioForeignProxyBaseLoserAppealPeriodMultiplier,
  readRealitioForeignProxyBaseLoserMultiplier,
  readRealitioForeignProxyBaseMessenger,
  readRealitioForeignProxyBaseMetaEvidenceId,
  readRealitioForeignProxyBaseMinGasLimit,
  readRealitioForeignProxyBaseMultiplierDivisor,
  readRealitioForeignProxyBaseNumberOfChoicesForArbitrator,
  readRealitioForeignProxyBaseNumberOfRulingOptions,
  readRealitioForeignProxyBaseQuestionIdToArbitrationId,
  readRealitioForeignProxyBaseRefuseToArbitrateRealitio,
  readRealitioForeignProxyBaseVersion,
  readRealitioForeignProxyBaseWNative,
  readRealitioForeignProxyBaseWinnerMultiplier,
  readRealitioForeignProxyOptimism,
  readRealitioForeignProxyOptimismArbitrationCreatedBlock,
  readRealitioForeignProxyOptimismArbitrationIdToDisputeExists,
  readRealitioForeignProxyOptimismArbitrationIdToRequester,
  readRealitioForeignProxyOptimismArbitrationRequests,
  readRealitioForeignProxyOptimismArbitrator,
  readRealitioForeignProxyOptimismArbitratorExtraData,
  readRealitioForeignProxyOptimismDisputeIdToDisputeDetails,
  readRealitioForeignProxyOptimismExternalIDtoLocalId,
  readRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings,
  readRealitioForeignProxyOptimismGetDisputeFee,
  readRealitioForeignProxyOptimismGetFundingStatus,
  readRealitioForeignProxyOptimismGetMultipliers,
  readRealitioForeignProxyOptimismGetNumberOfRounds,
  readRealitioForeignProxyOptimismGetRoundInfo,
  readRealitioForeignProxyOptimismGetTotalWithdrawableAmount,
  readRealitioForeignProxyOptimismHomeProxy,
  readRealitioForeignProxyOptimismLoserAppealPeriodMultiplier,
  readRealitioForeignProxyOptimismLoserMultiplier,
  readRealitioForeignProxyOptimismMessenger,
  readRealitioForeignProxyOptimismMetaEvidenceId,
  readRealitioForeignProxyOptimismMinGasLimit,
  readRealitioForeignProxyOptimismMultiplierDivisor,
  readRealitioForeignProxyOptimismNumberOfChoicesForArbitrator,
  readRealitioForeignProxyOptimismNumberOfRulingOptions,
  readRealitioForeignProxyOptimismQuestionIdToArbitrationId,
  readRealitioForeignProxyOptimismRefuseToArbitrateRealitio,
  readRealitioForeignProxyOptimismVersion,
  readRealitioForeignProxyOptimismWNative,
  readRealitioForeignProxyOptimismWinnerMultiplier,
  readRealitioV2_1ArbitratorWithAppeals,
  readRealitioV2_1ArbitratorWithAppealsArbitrationRequests,
  readRealitioV2_1ArbitratorWithAppealsArbitrator,
  readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData,
  readRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId,
  readRealitioV2_1ArbitratorWithAppealsGetDisputeFee,
  readRealitioV2_1ArbitratorWithAppealsGetMultipliers,
  readRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount,
  readRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier,
  readRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier,
  readRealitioV2_1ArbitratorWithAppealsMetadata,
  readRealitioV2_1ArbitratorWithAppealsMultiplierDenominator,
  readRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions,
  readRealitioV2_1ArbitratorWithAppealsRealitio,
  readRealitioV2_1ArbitratorWithAppealsVersion,
  readRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier,
  realitioForeignArbitrationProxyWithAppealsAbi,
  realitioForeignArbitrationProxyWithAppealsAddress,
  realitioForeignArbitrationProxyWithAppealsConfig,
  realitioForeignProxyBaseAbi,
  realitioForeignProxyBaseAddress,
  realitioForeignProxyBaseConfig,
  realitioForeignProxyOptimismAbi,
  realitioForeignProxyOptimismAddress,
  realitioForeignProxyOptimismConfig,
  realitioV2_1ArbitratorWithAppealsAbi,
  realitioV2_1ArbitratorWithAppealsAddress,
  realitioV2_1ArbitratorWithAppealsConfig,
  simulateRealitioForeignArbitrationProxyWithAppeals,
  simulateRealitioForeignArbitrationProxyWithAppealsFundAppeal,
  simulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation,
  simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement,
  simulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation,
  simulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration,
  simulateRealitioForeignArbitrationProxyWithAppealsRule,
  simulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence,
  simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards,
  simulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds,
  simulateRealitioForeignProxyBase,
  simulateRealitioForeignProxyBaseFundAppeal,
  simulateRealitioForeignProxyBaseHandleFailedDisputeCreation,
  simulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters,
  simulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement,
  simulateRealitioForeignProxyBaseReceiveArbitrationCancelation,
  simulateRealitioForeignProxyBaseRelayRule,
  simulateRealitioForeignProxyBaseRelayRuleCustomParameters,
  simulateRealitioForeignProxyBaseRequestArbitration,
  simulateRealitioForeignProxyBaseRequestArbitrationCustomParameters,
  simulateRealitioForeignProxyBaseRule,
  simulateRealitioForeignProxyBaseSubmitEvidence,
  simulateRealitioForeignProxyBaseWithdrawFeesAndRewards,
  simulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds,
  simulateRealitioForeignProxyOptimism,
  simulateRealitioForeignProxyOptimismFundAppeal,
  simulateRealitioForeignProxyOptimismHandleFailedDisputeCreation,
  simulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters,
  simulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement,
  simulateRealitioForeignProxyOptimismReceiveArbitrationCancelation,
  simulateRealitioForeignProxyOptimismRelayRule,
  simulateRealitioForeignProxyOptimismRelayRuleCustomParameters,
  simulateRealitioForeignProxyOptimismRequestArbitration,
  simulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters,
  simulateRealitioForeignProxyOptimismRule,
  simulateRealitioForeignProxyOptimismSubmitEvidence,
  simulateRealitioForeignProxyOptimismWithdrawFeesAndRewards,
  simulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds,
  simulateRealitioV2_1ArbitratorWithAppeals,
  simulateRealitioV2_1ArbitratorWithAppealsFundAppeal,
  simulateRealitioV2_1ArbitratorWithAppealsReportAnswer,
  simulateRealitioV2_1ArbitratorWithAppealsRequestArbitration,
  simulateRealitioV2_1ArbitratorWithAppealsRule,
  simulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence,
  simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards,
  simulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds,
  useReadRealitioForeignArbitrationProxyWithAppeals,
  useReadRealitioForeignArbitrationProxyWithAppealsAmb,
  useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToDisputeExists,
  useReadRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  useReadRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
  useReadRealitioForeignArbitrationProxyWithAppealsArbitrator,
  useReadRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData,
  useReadRealitioForeignArbitrationProxyWithAppealsDisputeIdToDisputeDetails,
  useReadRealitioForeignArbitrationProxyWithAppealsExternalIDtoLocalId,
  useReadRealitioForeignArbitrationProxyWithAppealsGetContributionsToSuccessfulFundings,
  useReadRealitioForeignArbitrationProxyWithAppealsGetDisputeFee,
  useReadRealitioForeignArbitrationProxyWithAppealsGetFundingStatus,
  useReadRealitioForeignArbitrationProxyWithAppealsGetMultipliers,
  useReadRealitioForeignArbitrationProxyWithAppealsGetNumberOfRounds,
  useReadRealitioForeignArbitrationProxyWithAppealsGetRoundInfo,
  useReadRealitioForeignArbitrationProxyWithAppealsGetTotalWithdrawableAmount,
  useReadRealitioForeignArbitrationProxyWithAppealsHomeChainId,
  useReadRealitioForeignArbitrationProxyWithAppealsHomeProxy,
  useReadRealitioForeignArbitrationProxyWithAppealsLoserAppealPeriodMultiplier,
  useReadRealitioForeignArbitrationProxyWithAppealsLoserMultiplier,
  useReadRealitioForeignArbitrationProxyWithAppealsMetaEvidenceId,
  useReadRealitioForeignArbitrationProxyWithAppealsMultiplierDivisor,
  useReadRealitioForeignArbitrationProxyWithAppealsNumberOfChoicesForArbitrator,
  useReadRealitioForeignArbitrationProxyWithAppealsNumberOfRulingOptions,
  useReadRealitioForeignArbitrationProxyWithAppealsQuestionIdToArbitrationId,
  useReadRealitioForeignArbitrationProxyWithAppealsTermsOfService,
  useReadRealitioForeignArbitrationProxyWithAppealsVersion,
  useReadRealitioForeignArbitrationProxyWithAppealsWinnerMultiplier,
  useReadRealitioForeignProxyBase,
  useReadRealitioForeignProxyBaseArbitrationCreatedBlock,
  useReadRealitioForeignProxyBaseArbitrationIdToDisputeExists,
  useReadRealitioForeignProxyBaseArbitrationIdToRequester,
  useReadRealitioForeignProxyBaseArbitrationRequests,
  useReadRealitioForeignProxyBaseArbitrator,
  useReadRealitioForeignProxyBaseArbitratorExtraData,
  useReadRealitioForeignProxyBaseDisputeIdToDisputeDetails,
  useReadRealitioForeignProxyBaseExternalIDtoLocalId,
  useReadRealitioForeignProxyBaseGetContributionsToSuccessfulFundings,
  useReadRealitioForeignProxyBaseGetDisputeFee,
  useReadRealitioForeignProxyBaseGetFundingStatus,
  useReadRealitioForeignProxyBaseGetMultipliers,
  useReadRealitioForeignProxyBaseGetNumberOfRounds,
  useReadRealitioForeignProxyBaseGetRoundInfo,
  useReadRealitioForeignProxyBaseGetTotalWithdrawableAmount,
  useReadRealitioForeignProxyBaseHomeProxy,
  useReadRealitioForeignProxyBaseLoserAppealPeriodMultiplier,
  useReadRealitioForeignProxyBaseLoserMultiplier,
  useReadRealitioForeignProxyBaseMessenger,
  useReadRealitioForeignProxyBaseMetaEvidenceId,
  useReadRealitioForeignProxyBaseMinGasLimit,
  useReadRealitioForeignProxyBaseMultiplierDivisor,
  useReadRealitioForeignProxyBaseNumberOfChoicesForArbitrator,
  useReadRealitioForeignProxyBaseNumberOfRulingOptions,
  useReadRealitioForeignProxyBaseQuestionIdToArbitrationId,
  useReadRealitioForeignProxyBaseRefuseToArbitrateRealitio,
  useReadRealitioForeignProxyBaseVersion,
  useReadRealitioForeignProxyBaseWNative,
  useReadRealitioForeignProxyBaseWinnerMultiplier,
  useReadRealitioForeignProxyOptimism,
  useReadRealitioForeignProxyOptimismArbitrationCreatedBlock,
  useReadRealitioForeignProxyOptimismArbitrationIdToDisputeExists,
  useReadRealitioForeignProxyOptimismArbitrationIdToRequester,
  useReadRealitioForeignProxyOptimismArbitrationRequests,
  useReadRealitioForeignProxyOptimismArbitrator,
  useReadRealitioForeignProxyOptimismArbitratorExtraData,
  useReadRealitioForeignProxyOptimismDisputeIdToDisputeDetails,
  useReadRealitioForeignProxyOptimismExternalIDtoLocalId,
  useReadRealitioForeignProxyOptimismGetContributionsToSuccessfulFundings,
  useReadRealitioForeignProxyOptimismGetDisputeFee,
  useReadRealitioForeignProxyOptimismGetFundingStatus,
  useReadRealitioForeignProxyOptimismGetMultipliers,
  useReadRealitioForeignProxyOptimismGetNumberOfRounds,
  useReadRealitioForeignProxyOptimismGetRoundInfo,
  useReadRealitioForeignProxyOptimismGetTotalWithdrawableAmount,
  useReadRealitioForeignProxyOptimismHomeProxy,
  useReadRealitioForeignProxyOptimismLoserAppealPeriodMultiplier,
  useReadRealitioForeignProxyOptimismLoserMultiplier,
  useReadRealitioForeignProxyOptimismMessenger,
  useReadRealitioForeignProxyOptimismMetaEvidenceId,
  useReadRealitioForeignProxyOptimismMinGasLimit,
  useReadRealitioForeignProxyOptimismMultiplierDivisor,
  useReadRealitioForeignProxyOptimismNumberOfChoicesForArbitrator,
  useReadRealitioForeignProxyOptimismNumberOfRulingOptions,
  useReadRealitioForeignProxyOptimismQuestionIdToArbitrationId,
  useReadRealitioForeignProxyOptimismRefuseToArbitrateRealitio,
  useReadRealitioForeignProxyOptimismVersion,
  useReadRealitioForeignProxyOptimismWNative,
  useReadRealitioForeignProxyOptimismWinnerMultiplier,
  useReadRealitioV2_1ArbitratorWithAppeals,
  useReadRealitioV2_1ArbitratorWithAppealsArbitrationRequests,
  useReadRealitioV2_1ArbitratorWithAppealsArbitrator,
  useReadRealitioV2_1ArbitratorWithAppealsArbitratorExtraData,
  useReadRealitioV2_1ArbitratorWithAppealsExternalIDtoLocalId,
  useReadRealitioV2_1ArbitratorWithAppealsGetDisputeFee,
  useReadRealitioV2_1ArbitratorWithAppealsGetMultipliers,
  useReadRealitioV2_1ArbitratorWithAppealsGetTotalWithdrawableAmount,
  useReadRealitioV2_1ArbitratorWithAppealsLoserAppealPeriodMultiplier,
  useReadRealitioV2_1ArbitratorWithAppealsLoserStakeMultiplier,
  useReadRealitioV2_1ArbitratorWithAppealsMetadata,
  useReadRealitioV2_1ArbitratorWithAppealsMultiplierDenominator,
  useReadRealitioV2_1ArbitratorWithAppealsNumberOfRulingOptions,
  useReadRealitioV2_1ArbitratorWithAppealsRealitio,
  useReadRealitioV2_1ArbitratorWithAppealsVersion,
  useReadRealitioV2_1ArbitratorWithAppealsWinnerStakeMultiplier,
  useSimulateRealitioForeignArbitrationProxyWithAppeals,
  useSimulateRealitioForeignArbitrationProxyWithAppealsFundAppeal,
  useSimulateRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation,
  useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement,
  useSimulateRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation,
  useSimulateRealitioForeignArbitrationProxyWithAppealsRequestArbitration,
  useSimulateRealitioForeignArbitrationProxyWithAppealsRule,
  useSimulateRealitioForeignArbitrationProxyWithAppealsSubmitEvidence,
  useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards,
  useSimulateRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds,
  useSimulateRealitioForeignProxyBase,
  useSimulateRealitioForeignProxyBaseFundAppeal,
  useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreation,
  useSimulateRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters,
  useSimulateRealitioForeignProxyBaseReceiveArbitrationAcknowledgement,
  useSimulateRealitioForeignProxyBaseReceiveArbitrationCancelation,
  useSimulateRealitioForeignProxyBaseRelayRule,
  useSimulateRealitioForeignProxyBaseRelayRuleCustomParameters,
  useSimulateRealitioForeignProxyBaseRequestArbitration,
  useSimulateRealitioForeignProxyBaseRequestArbitrationCustomParameters,
  useSimulateRealitioForeignProxyBaseRule,
  useSimulateRealitioForeignProxyBaseSubmitEvidence,
  useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewards,
  useSimulateRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds,
  useSimulateRealitioForeignProxyOptimism,
  useSimulateRealitioForeignProxyOptimismFundAppeal,
  useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreation,
  useSimulateRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters,
  useSimulateRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement,
  useSimulateRealitioForeignProxyOptimismReceiveArbitrationCancelation,
  useSimulateRealitioForeignProxyOptimismRelayRule,
  useSimulateRealitioForeignProxyOptimismRelayRuleCustomParameters,
  useSimulateRealitioForeignProxyOptimismRequestArbitration,
  useSimulateRealitioForeignProxyOptimismRequestArbitrationCustomParameters,
  useSimulateRealitioForeignProxyOptimismRule,
  useSimulateRealitioForeignProxyOptimismSubmitEvidence,
  useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewards,
  useSimulateRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds,
  useSimulateRealitioV2_1ArbitratorWithAppeals,
  useSimulateRealitioV2_1ArbitratorWithAppealsFundAppeal,
  useSimulateRealitioV2_1ArbitratorWithAppealsReportAnswer,
  useSimulateRealitioV2_1ArbitratorWithAppealsRequestArbitration,
  useSimulateRealitioV2_1ArbitratorWithAppealsRule,
  useSimulateRealitioV2_1ArbitratorWithAppealsSubmitEvidence,
  useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards,
  useSimulateRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds,
  useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsContributionEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsDisputeEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsRulingEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent,
  useWatchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent,
  useWatchRealitioForeignProxyBaseArbitrationCanceledEvent,
  useWatchRealitioForeignProxyBaseArbitrationCreatedEvent,
  useWatchRealitioForeignProxyBaseArbitrationFailedEvent,
  useWatchRealitioForeignProxyBaseArbitrationRequestedEvent,
  useWatchRealitioForeignProxyBaseContributionEvent,
  useWatchRealitioForeignProxyBaseDisputeEvent,
  useWatchRealitioForeignProxyBaseEvent,
  useWatchRealitioForeignProxyBaseEvidenceEvent,
  useWatchRealitioForeignProxyBaseMetaEvidenceEvent,
  useWatchRealitioForeignProxyBaseRulingEvent,
  useWatchRealitioForeignProxyBaseRulingFundedEvent,
  useWatchRealitioForeignProxyBaseRulingRelayedEvent,
  useWatchRealitioForeignProxyBaseWithdrawalEvent,
  useWatchRealitioForeignProxyOptimismArbitrationCanceledEvent,
  useWatchRealitioForeignProxyOptimismArbitrationCreatedEvent,
  useWatchRealitioForeignProxyOptimismArbitrationFailedEvent,
  useWatchRealitioForeignProxyOptimismArbitrationRequestedEvent,
  useWatchRealitioForeignProxyOptimismContributionEvent,
  useWatchRealitioForeignProxyOptimismDisputeEvent,
  useWatchRealitioForeignProxyOptimismEvent,
  useWatchRealitioForeignProxyOptimismEvidenceEvent,
  useWatchRealitioForeignProxyOptimismMetaEvidenceEvent,
  useWatchRealitioForeignProxyOptimismRulingEvent,
  useWatchRealitioForeignProxyOptimismRulingFundedEvent,
  useWatchRealitioForeignProxyOptimismRulingRelayedEvent,
  useWatchRealitioForeignProxyOptimismWithdrawalEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsContributionEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsDisputeEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsEvidenceEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsRulingEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent,
  useWatchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent,
  useWriteRealitioForeignArbitrationProxyWithAppeals,
  useWriteRealitioForeignArbitrationProxyWithAppealsFundAppeal,
  useWriteRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation,
  useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement,
  useWriteRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation,
  useWriteRealitioForeignArbitrationProxyWithAppealsRequestArbitration,
  useWriteRealitioForeignArbitrationProxyWithAppealsRule,
  useWriteRealitioForeignArbitrationProxyWithAppealsSubmitEvidence,
  useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards,
  useWriteRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds,
  useWriteRealitioForeignProxyBase,
  useWriteRealitioForeignProxyBaseFundAppeal,
  useWriteRealitioForeignProxyBaseHandleFailedDisputeCreation,
  useWriteRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters,
  useWriteRealitioForeignProxyBaseReceiveArbitrationAcknowledgement,
  useWriteRealitioForeignProxyBaseReceiveArbitrationCancelation,
  useWriteRealitioForeignProxyBaseRelayRule,
  useWriteRealitioForeignProxyBaseRelayRuleCustomParameters,
  useWriteRealitioForeignProxyBaseRequestArbitration,
  useWriteRealitioForeignProxyBaseRequestArbitrationCustomParameters,
  useWriteRealitioForeignProxyBaseRule,
  useWriteRealitioForeignProxyBaseSubmitEvidence,
  useWriteRealitioForeignProxyBaseWithdrawFeesAndRewards,
  useWriteRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds,
  useWriteRealitioForeignProxyOptimism,
  useWriteRealitioForeignProxyOptimismFundAppeal,
  useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreation,
  useWriteRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters,
  useWriteRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement,
  useWriteRealitioForeignProxyOptimismReceiveArbitrationCancelation,
  useWriteRealitioForeignProxyOptimismRelayRule,
  useWriteRealitioForeignProxyOptimismRelayRuleCustomParameters,
  useWriteRealitioForeignProxyOptimismRequestArbitration,
  useWriteRealitioForeignProxyOptimismRequestArbitrationCustomParameters,
  useWriteRealitioForeignProxyOptimismRule,
  useWriteRealitioForeignProxyOptimismSubmitEvidence,
  useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewards,
  useWriteRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds,
  useWriteRealitioV2_1ArbitratorWithAppeals,
  useWriteRealitioV2_1ArbitratorWithAppealsFundAppeal,
  useWriteRealitioV2_1ArbitratorWithAppealsReportAnswer,
  useWriteRealitioV2_1ArbitratorWithAppealsRequestArbitration,
  useWriteRealitioV2_1ArbitratorWithAppealsRule,
  useWriteRealitioV2_1ArbitratorWithAppealsSubmitEvidence,
  useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards,
  useWriteRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds,
  watchRealitioForeignArbitrationProxyWithAppealsArbitrationCanceledEvent,
  watchRealitioForeignArbitrationProxyWithAppealsArbitrationCreatedEvent,
  watchRealitioForeignArbitrationProxyWithAppealsArbitrationFailedEvent,
  watchRealitioForeignArbitrationProxyWithAppealsArbitrationRequestedEvent,
  watchRealitioForeignArbitrationProxyWithAppealsContributionEvent,
  watchRealitioForeignArbitrationProxyWithAppealsDisputeEvent,
  watchRealitioForeignArbitrationProxyWithAppealsEvent,
  watchRealitioForeignArbitrationProxyWithAppealsEvidenceEvent,
  watchRealitioForeignArbitrationProxyWithAppealsMetaEvidenceEvent,
  watchRealitioForeignArbitrationProxyWithAppealsRulingEvent,
  watchRealitioForeignArbitrationProxyWithAppealsRulingFundedEvent,
  watchRealitioForeignArbitrationProxyWithAppealsWithdrawalEvent,
  watchRealitioForeignProxyBaseArbitrationCanceledEvent,
  watchRealitioForeignProxyBaseArbitrationCreatedEvent,
  watchRealitioForeignProxyBaseArbitrationFailedEvent,
  watchRealitioForeignProxyBaseArbitrationRequestedEvent,
  watchRealitioForeignProxyBaseContributionEvent,
  watchRealitioForeignProxyBaseDisputeEvent,
  watchRealitioForeignProxyBaseEvent,
  watchRealitioForeignProxyBaseEvidenceEvent,
  watchRealitioForeignProxyBaseMetaEvidenceEvent,
  watchRealitioForeignProxyBaseRulingEvent,
  watchRealitioForeignProxyBaseRulingFundedEvent,
  watchRealitioForeignProxyBaseRulingRelayedEvent,
  watchRealitioForeignProxyBaseWithdrawalEvent,
  watchRealitioForeignProxyOptimismArbitrationCanceledEvent,
  watchRealitioForeignProxyOptimismArbitrationCreatedEvent,
  watchRealitioForeignProxyOptimismArbitrationFailedEvent,
  watchRealitioForeignProxyOptimismArbitrationRequestedEvent,
  watchRealitioForeignProxyOptimismContributionEvent,
  watchRealitioForeignProxyOptimismDisputeEvent,
  watchRealitioForeignProxyOptimismEvent,
  watchRealitioForeignProxyOptimismEvidenceEvent,
  watchRealitioForeignProxyOptimismMetaEvidenceEvent,
  watchRealitioForeignProxyOptimismRulingEvent,
  watchRealitioForeignProxyOptimismRulingFundedEvent,
  watchRealitioForeignProxyOptimismRulingRelayedEvent,
  watchRealitioForeignProxyOptimismWithdrawalEvent,
  watchRealitioV2_1ArbitratorWithAppealsContributionEvent,
  watchRealitioV2_1ArbitratorWithAppealsDisputeEvent,
  watchRealitioV2_1ArbitratorWithAppealsDisputeIdToQuestionIdEvent,
  watchRealitioV2_1ArbitratorWithAppealsEvent,
  watchRealitioV2_1ArbitratorWithAppealsEvidenceEvent,
  watchRealitioV2_1ArbitratorWithAppealsMetaEvidenceEvent,
  watchRealitioV2_1ArbitratorWithAppealsRulingEvent,
  watchRealitioV2_1ArbitratorWithAppealsRulingFundedEvent,
  watchRealitioV2_1ArbitratorWithAppealsWithdrawalEvent,
  writeRealitioForeignArbitrationProxyWithAppeals,
  writeRealitioForeignArbitrationProxyWithAppealsFundAppeal,
  writeRealitioForeignArbitrationProxyWithAppealsHandleFailedDisputeCreation,
  writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationAcknowledgement,
  writeRealitioForeignArbitrationProxyWithAppealsReceiveArbitrationCancelation,
  writeRealitioForeignArbitrationProxyWithAppealsRequestArbitration,
  writeRealitioForeignArbitrationProxyWithAppealsRule,
  writeRealitioForeignArbitrationProxyWithAppealsSubmitEvidence,
  writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewards,
  writeRealitioForeignArbitrationProxyWithAppealsWithdrawFeesAndRewardsForAllRounds,
  writeRealitioForeignProxyBase,
  writeRealitioForeignProxyBaseFundAppeal,
  writeRealitioForeignProxyBaseHandleFailedDisputeCreation,
  writeRealitioForeignProxyBaseHandleFailedDisputeCreationCustomParameters,
  writeRealitioForeignProxyBaseReceiveArbitrationAcknowledgement,
  writeRealitioForeignProxyBaseReceiveArbitrationCancelation,
  writeRealitioForeignProxyBaseRelayRule,
  writeRealitioForeignProxyBaseRelayRuleCustomParameters,
  writeRealitioForeignProxyBaseRequestArbitration,
  writeRealitioForeignProxyBaseRequestArbitrationCustomParameters,
  writeRealitioForeignProxyBaseRule,
  writeRealitioForeignProxyBaseSubmitEvidence,
  writeRealitioForeignProxyBaseWithdrawFeesAndRewards,
  writeRealitioForeignProxyBaseWithdrawFeesAndRewardsForAllRounds,
  writeRealitioForeignProxyOptimism,
  writeRealitioForeignProxyOptimismFundAppeal,
  writeRealitioForeignProxyOptimismHandleFailedDisputeCreation,
  writeRealitioForeignProxyOptimismHandleFailedDisputeCreationCustomParameters,
  writeRealitioForeignProxyOptimismReceiveArbitrationAcknowledgement,
  writeRealitioForeignProxyOptimismReceiveArbitrationCancelation,
  writeRealitioForeignProxyOptimismRelayRule,
  writeRealitioForeignProxyOptimismRelayRuleCustomParameters,
  writeRealitioForeignProxyOptimismRequestArbitration,
  writeRealitioForeignProxyOptimismRequestArbitrationCustomParameters,
  writeRealitioForeignProxyOptimismRule,
  writeRealitioForeignProxyOptimismSubmitEvidence,
  writeRealitioForeignProxyOptimismWithdrawFeesAndRewards,
  writeRealitioForeignProxyOptimismWithdrawFeesAndRewardsForAllRounds,
  writeRealitioV2_1ArbitratorWithAppeals,
  writeRealitioV2_1ArbitratorWithAppealsFundAppeal,
  writeRealitioV2_1ArbitratorWithAppealsReportAnswer,
  writeRealitioV2_1ArbitratorWithAppealsRequestArbitration,
  writeRealitioV2_1ArbitratorWithAppealsRule,
  writeRealitioV2_1ArbitratorWithAppealsSubmitEvidence,
  writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewards,
  writeRealitioV2_1ArbitratorWithAppealsWithdrawFeesAndRewardsForAllRounds
};
