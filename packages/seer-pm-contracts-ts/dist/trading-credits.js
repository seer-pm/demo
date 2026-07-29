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

// generated/contracts/trading-credits.ts
var trading_credits_exports = {};
__export(trading_credits_exports, {
  creditsManagerAbi: () => creditsManagerAbi,
  creditsManagerAddress: () => creditsManagerAddress,
  creditsManagerConfig: () => creditsManagerConfig,
  readCreditsManager: () => readCreditsManager,
  readCreditsManagerCanSpendCredits: () => readCreditsManagerCanSpendCredits,
  readCreditsManagerGovernor: () => readCreditsManagerGovernor,
  readCreditsManagerSeerCredits: () => readCreditsManagerSeerCredits,
  readCreditsManagerToken: () => readCreditsManagerToken,
  readCreditsManagerWhitelistedContracts: () => readCreditsManagerWhitelistedContracts,
  readSeerCredits: () => readSeerCredits,
  readSeerCreditsAllowance: () => readSeerCreditsAllowance,
  readSeerCreditsBalanceOf: () => readSeerCreditsBalanceOf,
  readSeerCreditsCreditsManager: () => readSeerCreditsCreditsManager,
  readSeerCreditsDecimals: () => readSeerCreditsDecimals,
  readSeerCreditsDomainSeparator: () => readSeerCreditsDomainSeparator,
  readSeerCreditsGovernor: () => readSeerCreditsGovernor,
  readSeerCreditsIsAdmin: () => readSeerCreditsIsAdmin,
  readSeerCreditsName: () => readSeerCreditsName,
  readSeerCreditsNonces: () => readSeerCreditsNonces,
  readSeerCreditsSymbol: () => readSeerCreditsSymbol,
  readSeerCreditsTotalSupply: () => readSeerCreditsTotalSupply,
  seerCreditsAbi: () => seerCreditsAbi,
  seerCreditsAddress: () => seerCreditsAddress,
  seerCreditsConfig: () => seerCreditsConfig,
  simulateCreditsManager: () => simulateCreditsManager,
  simulateCreditsManagerChangeGovernor: () => simulateCreditsManagerChangeGovernor,
  simulateCreditsManagerExecute: () => simulateCreditsManagerExecute,
  simulateCreditsManagerSetWhitelistedContract: () => simulateCreditsManagerSetWhitelistedContract,
  simulateCreditsManagerSweepTokens: () => simulateCreditsManagerSweepTokens,
  simulateSeerCredits: () => simulateSeerCredits,
  simulateSeerCreditsAddCreditsBalance: () => simulateSeerCreditsAddCreditsBalance,
  simulateSeerCreditsApprove: () => simulateSeerCreditsApprove,
  simulateSeerCreditsBurn: () => simulateSeerCreditsBurn,
  simulateSeerCreditsChangeCreditsManager: () => simulateSeerCreditsChangeCreditsManager,
  simulateSeerCreditsChangeGovernor: () => simulateSeerCreditsChangeGovernor,
  simulateSeerCreditsMint: () => simulateSeerCreditsMint,
  simulateSeerCreditsPermit: () => simulateSeerCreditsPermit,
  simulateSeerCreditsSetAdmin: () => simulateSeerCreditsSetAdmin,
  simulateSeerCreditsSetCreditsBalance: () => simulateSeerCreditsSetCreditsBalance,
  simulateSeerCreditsTransfer: () => simulateSeerCreditsTransfer,
  simulateSeerCreditsTransferFrom: () => simulateSeerCreditsTransferFrom,
  useReadCreditsManager: () => useReadCreditsManager,
  useReadCreditsManagerCanSpendCredits: () => useReadCreditsManagerCanSpendCredits,
  useReadCreditsManagerGovernor: () => useReadCreditsManagerGovernor,
  useReadCreditsManagerSeerCredits: () => useReadCreditsManagerSeerCredits,
  useReadCreditsManagerToken: () => useReadCreditsManagerToken,
  useReadCreditsManagerWhitelistedContracts: () => useReadCreditsManagerWhitelistedContracts,
  useReadSeerCredits: () => useReadSeerCredits,
  useReadSeerCreditsAllowance: () => useReadSeerCreditsAllowance,
  useReadSeerCreditsBalanceOf: () => useReadSeerCreditsBalanceOf,
  useReadSeerCreditsCreditsManager: () => useReadSeerCreditsCreditsManager,
  useReadSeerCreditsDecimals: () => useReadSeerCreditsDecimals,
  useReadSeerCreditsDomainSeparator: () => useReadSeerCreditsDomainSeparator,
  useReadSeerCreditsGovernor: () => useReadSeerCreditsGovernor,
  useReadSeerCreditsIsAdmin: () => useReadSeerCreditsIsAdmin,
  useReadSeerCreditsName: () => useReadSeerCreditsName,
  useReadSeerCreditsNonces: () => useReadSeerCreditsNonces,
  useReadSeerCreditsSymbol: () => useReadSeerCreditsSymbol,
  useReadSeerCreditsTotalSupply: () => useReadSeerCreditsTotalSupply,
  useSimulateCreditsManager: () => useSimulateCreditsManager,
  useSimulateCreditsManagerChangeGovernor: () => useSimulateCreditsManagerChangeGovernor,
  useSimulateCreditsManagerExecute: () => useSimulateCreditsManagerExecute,
  useSimulateCreditsManagerSetWhitelistedContract: () => useSimulateCreditsManagerSetWhitelistedContract,
  useSimulateCreditsManagerSweepTokens: () => useSimulateCreditsManagerSweepTokens,
  useSimulateSeerCredits: () => useSimulateSeerCredits,
  useSimulateSeerCreditsAddCreditsBalance: () => useSimulateSeerCreditsAddCreditsBalance,
  useSimulateSeerCreditsApprove: () => useSimulateSeerCreditsApprove,
  useSimulateSeerCreditsBurn: () => useSimulateSeerCreditsBurn,
  useSimulateSeerCreditsChangeCreditsManager: () => useSimulateSeerCreditsChangeCreditsManager,
  useSimulateSeerCreditsChangeGovernor: () => useSimulateSeerCreditsChangeGovernor,
  useSimulateSeerCreditsMint: () => useSimulateSeerCreditsMint,
  useSimulateSeerCreditsPermit: () => useSimulateSeerCreditsPermit,
  useSimulateSeerCreditsSetAdmin: () => useSimulateSeerCreditsSetAdmin,
  useSimulateSeerCreditsSetCreditsBalance: () => useSimulateSeerCreditsSetCreditsBalance,
  useSimulateSeerCreditsTransfer: () => useSimulateSeerCreditsTransfer,
  useSimulateSeerCreditsTransferFrom: () => useSimulateSeerCreditsTransferFrom,
  useWatchSeerCreditsApprovalEvent: () => useWatchSeerCreditsApprovalEvent,
  useWatchSeerCreditsEvent: () => useWatchSeerCreditsEvent,
  useWatchSeerCreditsTransferEvent: () => useWatchSeerCreditsTransferEvent,
  useWriteCreditsManager: () => useWriteCreditsManager,
  useWriteCreditsManagerChangeGovernor: () => useWriteCreditsManagerChangeGovernor,
  useWriteCreditsManagerExecute: () => useWriteCreditsManagerExecute,
  useWriteCreditsManagerSetWhitelistedContract: () => useWriteCreditsManagerSetWhitelistedContract,
  useWriteCreditsManagerSweepTokens: () => useWriteCreditsManagerSweepTokens,
  useWriteSeerCredits: () => useWriteSeerCredits,
  useWriteSeerCreditsAddCreditsBalance: () => useWriteSeerCreditsAddCreditsBalance,
  useWriteSeerCreditsApprove: () => useWriteSeerCreditsApprove,
  useWriteSeerCreditsBurn: () => useWriteSeerCreditsBurn,
  useWriteSeerCreditsChangeCreditsManager: () => useWriteSeerCreditsChangeCreditsManager,
  useWriteSeerCreditsChangeGovernor: () => useWriteSeerCreditsChangeGovernor,
  useWriteSeerCreditsMint: () => useWriteSeerCreditsMint,
  useWriteSeerCreditsPermit: () => useWriteSeerCreditsPermit,
  useWriteSeerCreditsSetAdmin: () => useWriteSeerCreditsSetAdmin,
  useWriteSeerCreditsSetCreditsBalance: () => useWriteSeerCreditsSetCreditsBalance,
  useWriteSeerCreditsTransfer: () => useWriteSeerCreditsTransfer,
  useWriteSeerCreditsTransferFrom: () => useWriteSeerCreditsTransferFrom,
  watchSeerCreditsApprovalEvent: () => watchSeerCreditsApprovalEvent,
  watchSeerCreditsEvent: () => watchSeerCreditsEvent,
  watchSeerCreditsTransferEvent: () => watchSeerCreditsTransferEvent,
  writeCreditsManager: () => writeCreditsManager,
  writeCreditsManagerChangeGovernor: () => writeCreditsManagerChangeGovernor,
  writeCreditsManagerExecute: () => writeCreditsManagerExecute,
  writeCreditsManagerSetWhitelistedContract: () => writeCreditsManagerSetWhitelistedContract,
  writeCreditsManagerSweepTokens: () => writeCreditsManagerSweepTokens,
  writeSeerCredits: () => writeSeerCredits,
  writeSeerCreditsAddCreditsBalance: () => writeSeerCreditsAddCreditsBalance,
  writeSeerCreditsApprove: () => writeSeerCreditsApprove,
  writeSeerCreditsBurn: () => writeSeerCreditsBurn,
  writeSeerCreditsChangeCreditsManager: () => writeSeerCreditsChangeCreditsManager,
  writeSeerCreditsChangeGovernor: () => writeSeerCreditsChangeGovernor,
  writeSeerCreditsMint: () => writeSeerCreditsMint,
  writeSeerCreditsPermit: () => writeSeerCreditsPermit,
  writeSeerCreditsSetAdmin: () => writeSeerCreditsSetAdmin,
  writeSeerCreditsSetCreditsBalance: () => writeSeerCreditsSetCreditsBalance,
  writeSeerCreditsTransfer: () => writeSeerCreditsTransfer,
  writeSeerCreditsTransferFrom: () => writeSeerCreditsTransferFrom
});
module.exports = __toCommonJS(trading_credits_exports);
var import_codegen = require("wagmi/codegen");
var import_codegen2 = require("wagmi/codegen");
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
var useReadCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useReadCreditsManagerCanSpendCredits = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "canSpendCredits"
});
var useReadCreditsManagerGovernor = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "governor"
});
var useReadCreditsManagerSeerCredits = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "seerCredits"
});
var useReadCreditsManagerToken = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "token"
});
var useReadCreditsManagerWhitelistedContracts = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "whitelistedContracts"
});
var useWriteCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useWriteCreditsManagerChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var useWriteCreditsManagerExecute = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var useWriteCreditsManagerSetWhitelistedContract = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var useWriteCreditsManagerSweepTokens = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var useSimulateCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var useSimulateCreditsManagerChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var useSimulateCreditsManagerExecute = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var useSimulateCreditsManagerSetWhitelistedContract = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var useSimulateCreditsManagerSweepTokens = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var useReadSeerCredits = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useReadSeerCreditsDomainSeparator = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "DOMAIN_SEPARATOR"
});
var useReadSeerCreditsAllowance = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "allowance"
});
var useReadSeerCreditsBalanceOf = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "balanceOf"
});
var useReadSeerCreditsCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "creditsManager"
});
var useReadSeerCreditsDecimals = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "decimals"
});
var useReadSeerCreditsGovernor = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "governor"
});
var useReadSeerCreditsIsAdmin = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "isAdmin"
});
var useReadSeerCreditsName = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "name"
});
var useReadSeerCreditsNonces = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "nonces"
});
var useReadSeerCreditsSymbol = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "symbol"
});
var useReadSeerCreditsTotalSupply = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "totalSupply"
});
var useWriteSeerCredits = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useWriteSeerCreditsAddCreditsBalance = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var useWriteSeerCreditsApprove = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var useWriteSeerCreditsBurn = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var useWriteSeerCreditsChangeCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var useWriteSeerCreditsChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var useWriteSeerCreditsMint = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var useWriteSeerCreditsPermit = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var useWriteSeerCreditsSetAdmin = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "setAdmin"
  }
);
var useWriteSeerCreditsSetCreditsBalance = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var useWriteSeerCreditsTransfer = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "transfer"
  }
);
var useWriteSeerCreditsTransferFrom = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var useSimulateSeerCredits = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useSimulateSeerCreditsAddCreditsBalance = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var useSimulateSeerCreditsApprove = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var useSimulateSeerCreditsBurn = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var useSimulateSeerCreditsChangeCreditsManager = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var useSimulateSeerCreditsChangeGovernor = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var useSimulateSeerCreditsMint = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var useSimulateSeerCreditsPermit = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var useSimulateSeerCreditsSetAdmin = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setAdmin"
});
var useSimulateSeerCreditsSetCreditsBalance = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var useSimulateSeerCreditsTransfer = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transfer"
});
var useSimulateSeerCreditsTransferFrom = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var useWatchSeerCreditsEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var useWatchSeerCreditsApprovalEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Approval"
});
var useWatchSeerCreditsTransferEvent = /* @__PURE__ */ (0, import_codegen.createUseWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Transfer"
});
var readCreditsManager = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var readCreditsManagerCanSpendCredits = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "canSpendCredits"
});
var readCreditsManagerGovernor = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "governor"
});
var readCreditsManagerSeerCredits = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "seerCredits"
});
var readCreditsManagerToken = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "token"
});
var readCreditsManagerWhitelistedContracts = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "whitelistedContracts"
});
var writeCreditsManager = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var writeCreditsManagerChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var writeCreditsManagerExecute = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var writeCreditsManagerSetWhitelistedContract = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var writeCreditsManagerSweepTokens = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: creditsManagerAbi,
    address: creditsManagerAddress,
    functionName: "sweepTokens"
  }
);
var simulateCreditsManager = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress
});
var simulateCreditsManagerChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "changeGovernor"
});
var simulateCreditsManagerExecute = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "execute"
});
var simulateCreditsManagerSetWhitelistedContract = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "setWhitelistedContract"
});
var simulateCreditsManagerSweepTokens = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: creditsManagerAbi,
  address: creditsManagerAddress,
  functionName: "sweepTokens"
});
var readSeerCredits = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var readSeerCreditsDomainSeparator = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "DOMAIN_SEPARATOR"
});
var readSeerCreditsAllowance = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "allowance"
});
var readSeerCreditsBalanceOf = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "balanceOf"
});
var readSeerCreditsCreditsManager = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "creditsManager"
});
var readSeerCreditsDecimals = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "decimals"
});
var readSeerCreditsGovernor = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "governor"
});
var readSeerCreditsIsAdmin = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "isAdmin"
});
var readSeerCreditsName = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "name"
});
var readSeerCreditsNonces = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "nonces"
});
var readSeerCreditsSymbol = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "symbol"
});
var readSeerCreditsTotalSupply = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "totalSupply"
});
var writeSeerCredits = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var writeSeerCreditsAddCreditsBalance = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var writeSeerCreditsApprove = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var writeSeerCreditsBurn = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var writeSeerCreditsChangeCreditsManager = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var writeSeerCreditsChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "changeGovernor"
  }
);
var writeSeerCreditsMint = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var writeSeerCreditsPermit = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var writeSeerCreditsSetAdmin = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setAdmin"
});
var writeSeerCreditsSetCreditsBalance = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var writeSeerCreditsTransfer = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transfer"
});
var writeSeerCreditsTransferFrom = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var simulateSeerCredits = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var simulateSeerCreditsAddCreditsBalance = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "addCreditsBalance"
});
var simulateSeerCreditsApprove = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "approve"
});
var simulateSeerCreditsBurn = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "burn"
});
var simulateSeerCreditsChangeCreditsManager = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeCreditsManager"
});
var simulateSeerCreditsChangeGovernor = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "changeGovernor"
});
var simulateSeerCreditsMint = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "mint"
});
var simulateSeerCreditsPermit = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "permit"
});
var simulateSeerCreditsSetAdmin = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "setAdmin"
  }
);
var simulateSeerCreditsSetCreditsBalance = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "setCreditsBalance"
});
var simulateSeerCreditsTransfer = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)(
  {
    abi: seerCreditsAbi,
    address: seerCreditsAddress,
    functionName: "transfer"
  }
);
var simulateSeerCreditsTransferFrom = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  functionName: "transferFrom"
});
var watchSeerCreditsEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress
});
var watchSeerCreditsApprovalEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Approval"
});
var watchSeerCreditsTransferEvent = /* @__PURE__ */ (0, import_codegen2.createWatchContractEvent)({
  abi: seerCreditsAbi,
  address: seerCreditsAddress,
  eventName: "Transfer"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
