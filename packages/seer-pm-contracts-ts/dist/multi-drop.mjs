// generated/contracts/multi-drop.ts
import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract
} from "wagmi/codegen";
import {
  createReadContract,
  createWriteContract,
  createSimulateContract
} from "wagmi/codegen";
var governedRecipientAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    inputs: [
      { name: "_newRecipients", internalType: "address[]", type: "address[]" }
    ],
    name: "addRecipients",
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
    name: "governor",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "_user", internalType: "address", type: "address" }],
    name: "isEligible",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "recipients",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "_oldRecipients", internalType: "address[]", type: "address[]" }
    ],
    name: "removeRecipients",
    outputs: [],
    stateMutability: "nonpayable"
  }
];
var governedRecipientAddress = {
  100: "0x9E850eB9699AC8417D3401ff1d89115214667b19",
  11155111: "0xBdF42243D843d34204f50CEC4F4308e432B511F6"
};
var governedRecipientConfig = {
  address: governedRecipientAddress,
  abi: governedRecipientAbi
};
var multiDropAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_recipient",
        internalType: "contract IRecipient",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_tokens", internalType: "contract ERC20[]", type: "address[]" },
      { name: "_amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "addTokens",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "allTokens",
    outputs: [
      { name: "", internalType: "contract ERC20[]", type: "address[]" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "amounts",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
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
      {
        name: "_recipient",
        internalType: "contract IRecipient",
        type: "address"
      }
    ],
    name: "changeRecipient",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "_i", internalType: "uint256", type: "uint256" },
      { name: "_token", internalType: "contract ERC20", type: "address" },
      { name: "_amount", internalType: "uint256", type: "uint256" }
    ],
    name: "changeToken",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "claimed",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
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
    inputs: [],
    name: "recipient",
    outputs: [
      { name: "", internalType: "contract IRecipient", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "tokens",
    outputs: [{ name: "", internalType: "contract ERC20", type: "address" }],
    stateMutability: "view"
  }
];
var multiDropAddress = {
  100: "0x28ABd3190674Dc57e4d3bEbeEC22f78d121810d5",
  11155111: "0x591aF101cAf2b7351C74c25F5E64bC2E062D2843"
};
var multiDropConfig = {
  address: multiDropAddress,
  abi: multiDropAbi
};
var useReadGovernedRecipient = /* @__PURE__ */ createUseReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var useReadGovernedRecipientGovernor = /* @__PURE__ */ createUseReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "governor"
});
var useReadGovernedRecipientIsEligible = /* @__PURE__ */ createUseReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "isEligible"
});
var useReadGovernedRecipientRecipients = /* @__PURE__ */ createUseReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "recipients"
});
var useWriteGovernedRecipient = /* @__PURE__ */ createUseWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var useWriteGovernedRecipientAddRecipients = /* @__PURE__ */ createUseWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "addRecipients"
});
var useWriteGovernedRecipientChangeGovernor = /* @__PURE__ */ createUseWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "changeGovernor"
});
var useWriteGovernedRecipientRemoveRecipients = /* @__PURE__ */ createUseWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "removeRecipients"
});
var useSimulateGovernedRecipient = /* @__PURE__ */ createUseSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var useSimulateGovernedRecipientAddRecipients = /* @__PURE__ */ createUseSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "addRecipients"
});
var useSimulateGovernedRecipientChangeGovernor = /* @__PURE__ */ createUseSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "changeGovernor"
});
var useSimulateGovernedRecipientRemoveRecipients = /* @__PURE__ */ createUseSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "removeRecipients"
});
var useReadMultiDrop = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var useReadMultiDropAllTokens = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "allTokens"
});
var useReadMultiDropAmounts = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "amounts"
});
var useReadMultiDropClaimed = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claimed"
});
var useReadMultiDropGovernor = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "governor"
});
var useReadMultiDropRecipient = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "recipient"
});
var useReadMultiDropTokens = /* @__PURE__ */ createUseReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "tokens"
});
var useWriteMultiDrop = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var useWriteMultiDropAddTokens = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "addTokens"
});
var useWriteMultiDropChangeGovernor = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeGovernor"
});
var useWriteMultiDropChangeRecipient = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeRecipient"
});
var useWriteMultiDropChangeToken = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeToken"
});
var useWriteMultiDropClaim = /* @__PURE__ */ createUseWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claim"
});
var useSimulateMultiDrop = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var useSimulateMultiDropAddTokens = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "addTokens"
});
var useSimulateMultiDropChangeGovernor = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeGovernor"
});
var useSimulateMultiDropChangeRecipient = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeRecipient"
});
var useSimulateMultiDropChangeToken = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeToken"
});
var useSimulateMultiDropClaim = /* @__PURE__ */ createUseSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claim"
});
var readGovernedRecipient = /* @__PURE__ */ createReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var readGovernedRecipientGovernor = /* @__PURE__ */ createReadContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "governor"
});
var readGovernedRecipientIsEligible = /* @__PURE__ */ createReadContract(
  {
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: "isEligible"
  }
);
var readGovernedRecipientRecipients = /* @__PURE__ */ createReadContract(
  {
    abi: governedRecipientAbi,
    address: governedRecipientAddress,
    functionName: "recipients"
  }
);
var writeGovernedRecipient = /* @__PURE__ */ createWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var writeGovernedRecipientAddRecipients = /* @__PURE__ */ createWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "addRecipients"
});
var writeGovernedRecipientChangeGovernor = /* @__PURE__ */ createWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "changeGovernor"
});
var writeGovernedRecipientRemoveRecipients = /* @__PURE__ */ createWriteContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "removeRecipients"
});
var simulateGovernedRecipient = /* @__PURE__ */ createSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress
});
var simulateGovernedRecipientAddRecipients = /* @__PURE__ */ createSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "addRecipients"
});
var simulateGovernedRecipientChangeGovernor = /* @__PURE__ */ createSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "changeGovernor"
});
var simulateGovernedRecipientRemoveRecipients = /* @__PURE__ */ createSimulateContract({
  abi: governedRecipientAbi,
  address: governedRecipientAddress,
  functionName: "removeRecipients"
});
var readMultiDrop = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var readMultiDropAllTokens = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "allTokens"
});
var readMultiDropAmounts = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "amounts"
});
var readMultiDropClaimed = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claimed"
});
var readMultiDropGovernor = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "governor"
});
var readMultiDropRecipient = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "recipient"
});
var readMultiDropTokens = /* @__PURE__ */ createReadContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "tokens"
});
var writeMultiDrop = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var writeMultiDropAddTokens = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "addTokens"
});
var writeMultiDropChangeGovernor = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeGovernor"
});
var writeMultiDropChangeRecipient = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeRecipient"
});
var writeMultiDropChangeToken = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeToken"
});
var writeMultiDropClaim = /* @__PURE__ */ createWriteContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claim"
});
var simulateMultiDrop = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress
});
var simulateMultiDropAddTokens = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "addTokens"
});
var simulateMultiDropChangeGovernor = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeGovernor"
});
var simulateMultiDropChangeRecipient = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeRecipient"
});
var simulateMultiDropChangeToken = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "changeToken"
});
var simulateMultiDropClaim = /* @__PURE__ */ createSimulateContract({
  abi: multiDropAbi,
  address: multiDropAddress,
  functionName: "claim"
});
export {
  governedRecipientAbi,
  governedRecipientAddress,
  governedRecipientConfig,
  multiDropAbi,
  multiDropAddress,
  multiDropConfig,
  readGovernedRecipient,
  readGovernedRecipientGovernor,
  readGovernedRecipientIsEligible,
  readGovernedRecipientRecipients,
  readMultiDrop,
  readMultiDropAllTokens,
  readMultiDropAmounts,
  readMultiDropClaimed,
  readMultiDropGovernor,
  readMultiDropRecipient,
  readMultiDropTokens,
  simulateGovernedRecipient,
  simulateGovernedRecipientAddRecipients,
  simulateGovernedRecipientChangeGovernor,
  simulateGovernedRecipientRemoveRecipients,
  simulateMultiDrop,
  simulateMultiDropAddTokens,
  simulateMultiDropChangeGovernor,
  simulateMultiDropChangeRecipient,
  simulateMultiDropChangeToken,
  simulateMultiDropClaim,
  useReadGovernedRecipient,
  useReadGovernedRecipientGovernor,
  useReadGovernedRecipientIsEligible,
  useReadGovernedRecipientRecipients,
  useReadMultiDrop,
  useReadMultiDropAllTokens,
  useReadMultiDropAmounts,
  useReadMultiDropClaimed,
  useReadMultiDropGovernor,
  useReadMultiDropRecipient,
  useReadMultiDropTokens,
  useSimulateGovernedRecipient,
  useSimulateGovernedRecipientAddRecipients,
  useSimulateGovernedRecipientChangeGovernor,
  useSimulateGovernedRecipientRemoveRecipients,
  useSimulateMultiDrop,
  useSimulateMultiDropAddTokens,
  useSimulateMultiDropChangeGovernor,
  useSimulateMultiDropChangeRecipient,
  useSimulateMultiDropChangeToken,
  useSimulateMultiDropClaim,
  useWriteGovernedRecipient,
  useWriteGovernedRecipientAddRecipients,
  useWriteGovernedRecipientChangeGovernor,
  useWriteGovernedRecipientRemoveRecipients,
  useWriteMultiDrop,
  useWriteMultiDropAddTokens,
  useWriteMultiDropChangeGovernor,
  useWriteMultiDropChangeRecipient,
  useWriteMultiDropChangeToken,
  useWriteMultiDropClaim,
  writeGovernedRecipient,
  writeGovernedRecipientAddRecipients,
  writeGovernedRecipientChangeGovernor,
  writeGovernedRecipientRemoveRecipients,
  writeMultiDrop,
  writeMultiDropAddTokens,
  writeMultiDropChangeGovernor,
  writeMultiDropChangeRecipient,
  writeMultiDropChangeToken,
  writeMultiDropClaim
};
