// generated/contracts/trading-credits.ts
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
var creditsManagerAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_token", internalType: "contract ERC20", type: "address" },
      {
        name: "_seerCredits",
        internalType: "contract SeerCredits",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_user", internalType: "address", type: "address" },
      { name: "_amount", internalType: "uint256", type: "uint256" }
    ],
    name: "canSpendCredits",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "_governor", internalType: "address", type: "address" }],
    name: "changeGovernor",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "amount", internalType: "uint256", type: "uint256" },
      { name: "outputToken", internalType: "contract ERC20", type: "address" }
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "governor",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "seerCredits",
    outputs: [
      { name: "", internalType: "contract SeerCredits", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_contract", internalType: "address", type: "address" },
      { name: "_whitelisted", internalType: "bool", type: "bool" }
    ],
    name: "setWhitelistedContract",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_token", internalType: "contract ERC20", type: "address" }
    ],
    name: "sweepTokens",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "token",
    outputs: [{ name: "", internalType: "contract ERC20", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "whitelistedContracts",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  }
];
var creditsManagerAddress = {
  100: "0xB29D0C9875D93483891c0645fdC13D665a4d2D70"
};
var creditsManagerConfig = {
  address: creditsManagerAddress,
  abi: creditsManagerAbi
};
var seerCreditsAbi = [
  {
    type: "constructor",
    inputs: [{ name: "_governor", internalType: "address", type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "spender",
        internalType: "address",
        type: "address",
        indexed: true
      },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Approval"
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false
      }
    ],
    name: "Transfer"
  },
  {
    type: "function",
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_addresses", internalType: "address[]", type: "address[]" },
      { name: "_amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "addCreditsBalance",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "spender", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
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
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_creditsManager", internalType: "address", type: "address" }
    ],
    name: "changeCreditsManager",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "_governor", internalType: "address", type: "address" }],
    name: "changeGovernor",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "creditsManager",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", internalType: "uint8", type: "uint8" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "governor",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "isAdmin",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "name",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "spender", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "deadline", internalType: "uint256", type: "uint256" },
      { name: "v", internalType: "uint8", type: "uint8" },
      { name: "r", internalType: "bytes32", type: "bytes32" },
      { name: "s", internalType: "bytes32", type: "bytes32" }
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_admin", internalType: "address", type: "address" },
      { name: "_isAdmin", internalType: "bool", type: "bool" }
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_addresses", internalType: "address[]", type: "address[]" },
      { name: "_amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "setCreditsBalance",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable"
  }
];
var seerCreditsAddress = {
  100: "0xEDd48e43EBd4E2b31238a5CBA8FD548fC051aCAF"
};
var seerCreditsConfig = {
  address: seerCreditsAddress,
  abi: seerCreditsAbi
};
var useReadCreditsManager = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useReadCreditsManagerCanSpendCredits = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "canSpendCredits"
});
var useReadCreditsManagerGovernor = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "governor"
});
var useReadCreditsManagerSeerCredits = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "seerCredits"
});
var useReadCreditsManagerToken = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "token"
});
var useReadCreditsManagerWhitelistedContracts = /* @__PURE__ */ createUseReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "whitelistedContracts"
});
var useWriteCreditsManager = /* @__PURE__ */ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useWriteCreditsManagerChangeGovernor = /* @__PURE__ */ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var useWriteCreditsManagerExecute = /* @__PURE__ */ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var useWriteCreditsManagerSetWhitelistedContract = /* @__PURE__ */ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var useWriteCreditsManagerSweepTokens = /* @__PURE__ */ createUseWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var useSimulateCreditsManager = /* @__PURE__ */ createUseSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useSimulateCreditsManagerChangeGovernor = /* @__PURE__ */ createUseSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var useSimulateCreditsManagerExecute = /* @__PURE__ */ createUseSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var useSimulateCreditsManagerSetWhitelistedContract = /* @__PURE__ */ createUseSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var useSimulateCreditsManagerSweepTokens = /* @__PURE__ */ createUseSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var useReadSeerCredits = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useReadSeerCreditsDomainSeparator = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "DOMAIN_SEPARATOR"
});
var useReadSeerCreditsAllowance = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "allowance"
});
var useReadSeerCreditsBalanceOf = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "balanceOf"
});
var useReadSeerCreditsCreditsManager = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "creditsManager"
});
var useReadSeerCreditsDecimals = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "decimals"
});
var useReadSeerCreditsGovernor = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "governor"
});
var useReadSeerCreditsIsAdmin = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "isAdmin"
});
var useReadSeerCreditsName = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "name"
});
var useReadSeerCreditsNonces = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "nonces"
});
var useReadSeerCreditsSymbol = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "symbol"
});
var useReadSeerCreditsTotalSupply = /* @__PURE__ */ createUseReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "totalSupply"
});
var useWriteSeerCredits = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useWriteSeerCreditsAddCreditsBalance = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var useWriteSeerCreditsApprove = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var useWriteSeerCreditsBurn = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var useWriteSeerCreditsChangeCreditsManager = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var useWriteSeerCreditsChangeGovernor = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var useWriteSeerCreditsMint = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var useWriteSeerCreditsPermit = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var useWriteSeerCreditsSetAdmin = /* @__PURE__ */ createUseWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "setAdmin"
  }
);
var useWriteSeerCreditsSetCreditsBalance = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var useWriteSeerCreditsTransfer = /* @__PURE__ */ createUseWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "transfer"
  }
);
var useWriteSeerCreditsTransferFrom = /* @__PURE__ */ createUseWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var useSimulateSeerCredits = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useSimulateSeerCreditsAddCreditsBalance = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var useSimulateSeerCreditsApprove = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var useSimulateSeerCreditsBurn = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var useSimulateSeerCreditsChangeCreditsManager = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var useSimulateSeerCreditsChangeGovernor = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var useSimulateSeerCreditsMint = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var useSimulateSeerCreditsPermit = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var useSimulateSeerCreditsSetAdmin = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setAdmin"
});
var useSimulateSeerCreditsSetCreditsBalance = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var useSimulateSeerCreditsTransfer = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transfer"
});
var useSimulateSeerCreditsTransferFrom = /* @__PURE__ */ createUseSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var useWatchSeerCreditsEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useWatchSeerCreditsApprovalEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Approval"
});
var useWatchSeerCreditsTransferEvent = /* @__PURE__ */ createUseWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Transfer"
});
var readCreditsManager = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var readCreditsManagerCanSpendCredits = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "canSpendCredits"
});
var readCreditsManagerGovernor = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "governor"
});
var readCreditsManagerSeerCredits = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "seerCredits"
});
var readCreditsManagerToken = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "token"
});
var readCreditsManagerWhitelistedContracts = /* @__PURE__ */ createReadContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "whitelistedContracts"
});
var writeCreditsManager = /* @__PURE__ */ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var writeCreditsManagerChangeGovernor = /* @__PURE__ */ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var writeCreditsManagerExecute = /* @__PURE__ */ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var writeCreditsManagerSetWhitelistedContract = /* @__PURE__ */ createWriteContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var writeCreditsManagerSweepTokens = /* @__PURE__ */ createWriteContract(
  {
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: "sweepTokens"
  }
);
var simulateCreditsManager = /* @__PURE__ */ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var simulateCreditsManagerChangeGovernor = /* @__PURE__ */ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var simulateCreditsManagerExecute = /* @__PURE__ */ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var simulateCreditsManagerSetWhitelistedContract = /* @__PURE__ */ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var simulateCreditsManagerSweepTokens = /* @__PURE__ */ createSimulateContract({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var readSeerCredits = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var readSeerCreditsDomainSeparator = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "DOMAIN_SEPARATOR"
});
var readSeerCreditsAllowance = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "allowance"
});
var readSeerCreditsBalanceOf = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "balanceOf"
});
var readSeerCreditsCreditsManager = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "creditsManager"
});
var readSeerCreditsDecimals = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "decimals"
});
var readSeerCreditsGovernor = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "governor"
});
var readSeerCreditsIsAdmin = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "isAdmin"
});
var readSeerCreditsName = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "name"
});
var readSeerCreditsNonces = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "nonces"
});
var readSeerCreditsSymbol = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "symbol"
});
var readSeerCreditsTotalSupply = /* @__PURE__ */ createReadContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "totalSupply"
});
var writeSeerCredits = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var writeSeerCreditsAddCreditsBalance = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var writeSeerCreditsApprove = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var writeSeerCreditsBurn = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var writeSeerCreditsChangeCreditsManager = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var writeSeerCreditsChangeGovernor = /* @__PURE__ */ createWriteContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "changeGovernor"
  }
);
var writeSeerCreditsMint = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var writeSeerCreditsPermit = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var writeSeerCreditsSetAdmin = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setAdmin"
});
var writeSeerCreditsSetCreditsBalance = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var writeSeerCreditsTransfer = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transfer"
});
var writeSeerCreditsTransferFrom = /* @__PURE__ */ createWriteContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var simulateSeerCredits = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var simulateSeerCreditsAddCreditsBalance = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var simulateSeerCreditsApprove = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var simulateSeerCreditsBurn = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var simulateSeerCreditsChangeCreditsManager = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var simulateSeerCreditsChangeGovernor = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var simulateSeerCreditsMint = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var simulateSeerCreditsPermit = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var simulateSeerCreditsSetAdmin = /* @__PURE__ */ createSimulateContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "setAdmin"
  }
);
var simulateSeerCreditsSetCreditsBalance = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var simulateSeerCreditsTransfer = /* @__PURE__ */ createSimulateContract(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "transfer"
  }
);
var simulateSeerCreditsTransferFrom = /* @__PURE__ */ createSimulateContract({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var watchSeerCreditsEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var watchSeerCreditsApprovalEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Approval"
});
var watchSeerCreditsTransferEvent = /* @__PURE__ */ createWatchContractEvent({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Transfer"
});
export {
  creditsManagerAbi,
  creditsManagerAddress,
  creditsManagerConfig,
  readCreditsManager,
  readCreditsManagerCanSpendCredits,
  readCreditsManagerGovernor,
  readCreditsManagerSeerCredits,
  readCreditsManagerToken,
  readCreditsManagerWhitelistedContracts,
  readSeerCredits,
  readSeerCreditsAllowance,
  readSeerCreditsBalanceOf,
  readSeerCreditsCreditsManager,
  readSeerCreditsDecimals,
  readSeerCreditsDomainSeparator,
  readSeerCreditsGovernor,
  readSeerCreditsIsAdmin,
  readSeerCreditsName,
  readSeerCreditsNonces,
  readSeerCreditsSymbol,
  readSeerCreditsTotalSupply,
  seerCreditsAbi,
  seerCreditsAddress,
  seerCreditsConfig,
  simulateCreditsManager,
  simulateCreditsManagerChangeGovernor,
  simulateCreditsManagerExecute,
  simulateCreditsManagerSetWhitelistedContract,
  simulateCreditsManagerSweepTokens,
  simulateSeerCredits,
  simulateSeerCreditsAddCreditsBalance,
  simulateSeerCreditsApprove,
  simulateSeerCreditsBurn,
  simulateSeerCreditsChangeCreditsManager,
  simulateSeerCreditsChangeGovernor,
  simulateSeerCreditsMint,
  simulateSeerCreditsPermit,
  simulateSeerCreditsSetAdmin,
  simulateSeerCreditsSetCreditsBalance,
  simulateSeerCreditsTransfer,
  simulateSeerCreditsTransferFrom,
  useReadCreditsManager,
  useReadCreditsManagerCanSpendCredits,
  useReadCreditsManagerGovernor,
  useReadCreditsManagerSeerCredits,
  useReadCreditsManagerToken,
  useReadCreditsManagerWhitelistedContracts,
  useReadSeerCredits,
  useReadSeerCreditsAllowance,
  useReadSeerCreditsBalanceOf,
  useReadSeerCreditsCreditsManager,
  useReadSeerCreditsDecimals,
  useReadSeerCreditsDomainSeparator,
  useReadSeerCreditsGovernor,
  useReadSeerCreditsIsAdmin,
  useReadSeerCreditsName,
  useReadSeerCreditsNonces,
  useReadSeerCreditsSymbol,
  useReadSeerCreditsTotalSupply,
  useSimulateCreditsManager,
  useSimulateCreditsManagerChangeGovernor,
  useSimulateCreditsManagerExecute,
  useSimulateCreditsManagerSetWhitelistedContract,
  useSimulateCreditsManagerSweepTokens,
  useSimulateSeerCredits,
  useSimulateSeerCreditsAddCreditsBalance,
  useSimulateSeerCreditsApprove,
  useSimulateSeerCreditsBurn,
  useSimulateSeerCreditsChangeCreditsManager,
  useSimulateSeerCreditsChangeGovernor,
  useSimulateSeerCreditsMint,
  useSimulateSeerCreditsPermit,
  useSimulateSeerCreditsSetAdmin,
  useSimulateSeerCreditsSetCreditsBalance,
  useSimulateSeerCreditsTransfer,
  useSimulateSeerCreditsTransferFrom,
  useWatchSeerCreditsApprovalEvent,
  useWatchSeerCreditsEvent,
  useWatchSeerCreditsTransferEvent,
  useWriteCreditsManager,
  useWriteCreditsManagerChangeGovernor,
  useWriteCreditsManagerExecute,
  useWriteCreditsManagerSetWhitelistedContract,
  useWriteCreditsManagerSweepTokens,
  useWriteSeerCredits,
  useWriteSeerCreditsAddCreditsBalance,
  useWriteSeerCreditsApprove,
  useWriteSeerCreditsBurn,
  useWriteSeerCreditsChangeCreditsManager,
  useWriteSeerCreditsChangeGovernor,
  useWriteSeerCreditsMint,
  useWriteSeerCreditsPermit,
  useWriteSeerCreditsSetAdmin,
  useWriteSeerCreditsSetCreditsBalance,
  useWriteSeerCreditsTransfer,
  useWriteSeerCreditsTransferFrom,
  watchSeerCreditsApprovalEvent,
  watchSeerCreditsEvent,
  watchSeerCreditsTransferEvent,
  writeCreditsManager,
  writeCreditsManagerChangeGovernor,
  writeCreditsManagerExecute,
  writeCreditsManagerSetWhitelistedContract,
  writeCreditsManagerSweepTokens,
  writeSeerCredits,
  writeSeerCreditsAddCreditsBalance,
  writeSeerCreditsApprove,
  writeSeerCreditsBurn,
  writeSeerCreditsChangeCreditsManager,
  writeSeerCreditsChangeGovernor,
  writeSeerCreditsMint,
  writeSeerCreditsPermit,
  writeSeerCreditsSetAdmin,
  writeSeerCreditsSetCreditsBalance,
  writeSeerCreditsTransfer,
  writeSeerCreditsTransferFrom
};
