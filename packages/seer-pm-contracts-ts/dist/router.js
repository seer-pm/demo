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

// generated/contracts/router.ts
var router_exports = {};
__export(router_exports, {
  conditionalRouterAbi: () => conditionalRouterAbi,
  conditionalRouterAddress: () => conditionalRouterAddress,
  conditionalRouterConfig: () => conditionalRouterConfig,
  futarchyRouterAbi: () => futarchyRouterAbi,
  futarchyRouterAddress: () => futarchyRouterAddress,
  futarchyRouterConfig: () => futarchyRouterConfig,
  gnosisRouterAbi: () => gnosisRouterAbi,
  gnosisRouterAddress: () => gnosisRouterAddress,
  gnosisRouterConfig: () => gnosisRouterConfig,
  mainnetRouterAbi: () => mainnetRouterAbi,
  mainnetRouterAddress: () => mainnetRouterAddress,
  mainnetRouterConfig: () => mainnetRouterConfig,
  readConditionalRouter: () => readConditionalRouter,
  readConditionalRouterConditionalTokens: () => readConditionalRouterConditionalTokens,
  readConditionalRouterGetTokenId: () => readConditionalRouterGetTokenId,
  readConditionalRouterGetWinningOutcomes: () => readConditionalRouterGetWinningOutcomes,
  readConditionalRouterSupportsInterface: () => readConditionalRouterSupportsInterface,
  readConditionalRouterWrapped1155Factory: () => readConditionalRouterWrapped1155Factory,
  readFutarchyRouter: () => readFutarchyRouter,
  readFutarchyRouterConditionalTokens: () => readFutarchyRouterConditionalTokens,
  readFutarchyRouterGetTokenId: () => readFutarchyRouterGetTokenId,
  readFutarchyRouterGetWinningOutcomes: () => readFutarchyRouterGetWinningOutcomes,
  readFutarchyRouterSupportsInterface: () => readFutarchyRouterSupportsInterface,
  readFutarchyRouterWrapped1155Factory: () => readFutarchyRouterWrapped1155Factory,
  readGnosisRouter: () => readGnosisRouter,
  readGnosisRouterConditionalTokens: () => readGnosisRouterConditionalTokens,
  readGnosisRouterGetTokenId: () => readGnosisRouterGetTokenId,
  readGnosisRouterGetWinningOutcomes: () => readGnosisRouterGetWinningOutcomes,
  readGnosisRouterSDai: () => readGnosisRouterSDai,
  readGnosisRouterSavingsXDaiAdapter: () => readGnosisRouterSavingsXDaiAdapter,
  readGnosisRouterSupportsInterface: () => readGnosisRouterSupportsInterface,
  readGnosisRouterWrapped1155Factory: () => readGnosisRouterWrapped1155Factory,
  readMainnetRouter: () => readMainnetRouter,
  readMainnetRouterConditionalTokens: () => readMainnetRouterConditionalTokens,
  readMainnetRouterDai: () => readMainnetRouterDai,
  readMainnetRouterGetTokenId: () => readMainnetRouterGetTokenId,
  readMainnetRouterGetWinningOutcomes: () => readMainnetRouterGetWinningOutcomes,
  readMainnetRouterSDai: () => readMainnetRouterSDai,
  readMainnetRouterSupportsInterface: () => readMainnetRouterSupportsInterface,
  readMainnetRouterWrapped1155Factory: () => readMainnetRouterWrapped1155Factory,
  readRouter: () => readRouter,
  readRouterConditionalTokens: () => readRouterConditionalTokens,
  readRouterGetTokenId: () => readRouterGetTokenId,
  readRouterGetWinningOutcomes: () => readRouterGetWinningOutcomes,
  readRouterSupportsInterface: () => readRouterSupportsInterface,
  readRouterWrapped1155Factory: () => readRouterWrapped1155Factory,
  routerAbi: () => routerAbi,
  routerAddress: () => routerAddress,
  routerConfig: () => routerConfig,
  simulateConditionalRouter: () => simulateConditionalRouter,
  simulateConditionalRouterMergePositions: () => simulateConditionalRouterMergePositions,
  simulateConditionalRouterOnErc1155BatchReceived: () => simulateConditionalRouterOnErc1155BatchReceived,
  simulateConditionalRouterOnErc1155Received: () => simulateConditionalRouterOnErc1155Received,
  simulateConditionalRouterRedeemConditionalToCollateral: () => simulateConditionalRouterRedeemConditionalToCollateral,
  simulateConditionalRouterRedeemPositions: () => simulateConditionalRouterRedeemPositions,
  simulateConditionalRouterSplitPosition: () => simulateConditionalRouterSplitPosition,
  simulateFutarchyRouter: () => simulateFutarchyRouter,
  simulateFutarchyRouterMergePositions: () => simulateFutarchyRouterMergePositions,
  simulateFutarchyRouterOnErc1155BatchReceived: () => simulateFutarchyRouterOnErc1155BatchReceived,
  simulateFutarchyRouterOnErc1155Received: () => simulateFutarchyRouterOnErc1155Received,
  simulateFutarchyRouterRedeemPositions: () => simulateFutarchyRouterRedeemPositions,
  simulateFutarchyRouterRedeemProposal: () => simulateFutarchyRouterRedeemProposal,
  simulateFutarchyRouterSplitPosition: () => simulateFutarchyRouterSplitPosition,
  simulateGnosisRouter: () => simulateGnosisRouter,
  simulateGnosisRouterMergePositions: () => simulateGnosisRouterMergePositions,
  simulateGnosisRouterMergeToBase: () => simulateGnosisRouterMergeToBase,
  simulateGnosisRouterOnErc1155BatchReceived: () => simulateGnosisRouterOnErc1155BatchReceived,
  simulateGnosisRouterOnErc1155Received: () => simulateGnosisRouterOnErc1155Received,
  simulateGnosisRouterRedeemPositions: () => simulateGnosisRouterRedeemPositions,
  simulateGnosisRouterRedeemToBase: () => simulateGnosisRouterRedeemToBase,
  simulateGnosisRouterSplitFromBase: () => simulateGnosisRouterSplitFromBase,
  simulateGnosisRouterSplitPosition: () => simulateGnosisRouterSplitPosition,
  simulateMainnetRouter: () => simulateMainnetRouter,
  simulateMainnetRouterMergePositions: () => simulateMainnetRouterMergePositions,
  simulateMainnetRouterMergeToDai: () => simulateMainnetRouterMergeToDai,
  simulateMainnetRouterOnErc1155BatchReceived: () => simulateMainnetRouterOnErc1155BatchReceived,
  simulateMainnetRouterOnErc1155Received: () => simulateMainnetRouterOnErc1155Received,
  simulateMainnetRouterRedeemPositions: () => simulateMainnetRouterRedeemPositions,
  simulateMainnetRouterRedeemToDai: () => simulateMainnetRouterRedeemToDai,
  simulateMainnetRouterSplitFromDai: () => simulateMainnetRouterSplitFromDai,
  simulateMainnetRouterSplitPosition: () => simulateMainnetRouterSplitPosition,
  simulateRouter: () => simulateRouter,
  simulateRouterMergePositions: () => simulateRouterMergePositions,
  simulateRouterOnErc1155BatchReceived: () => simulateRouterOnErc1155BatchReceived,
  simulateRouterOnErc1155Received: () => simulateRouterOnErc1155Received,
  simulateRouterRedeemPositions: () => simulateRouterRedeemPositions,
  simulateRouterSplitPosition: () => simulateRouterSplitPosition,
  useReadConditionalRouter: () => useReadConditionalRouter,
  useReadConditionalRouterConditionalTokens: () => useReadConditionalRouterConditionalTokens,
  useReadConditionalRouterGetTokenId: () => useReadConditionalRouterGetTokenId,
  useReadConditionalRouterGetWinningOutcomes: () => useReadConditionalRouterGetWinningOutcomes,
  useReadConditionalRouterSupportsInterface: () => useReadConditionalRouterSupportsInterface,
  useReadConditionalRouterWrapped1155Factory: () => useReadConditionalRouterWrapped1155Factory,
  useReadFutarchyRouter: () => useReadFutarchyRouter,
  useReadFutarchyRouterConditionalTokens: () => useReadFutarchyRouterConditionalTokens,
  useReadFutarchyRouterGetTokenId: () => useReadFutarchyRouterGetTokenId,
  useReadFutarchyRouterGetWinningOutcomes: () => useReadFutarchyRouterGetWinningOutcomes,
  useReadFutarchyRouterSupportsInterface: () => useReadFutarchyRouterSupportsInterface,
  useReadFutarchyRouterWrapped1155Factory: () => useReadFutarchyRouterWrapped1155Factory,
  useReadGnosisRouter: () => useReadGnosisRouter,
  useReadGnosisRouterConditionalTokens: () => useReadGnosisRouterConditionalTokens,
  useReadGnosisRouterGetTokenId: () => useReadGnosisRouterGetTokenId,
  useReadGnosisRouterGetWinningOutcomes: () => useReadGnosisRouterGetWinningOutcomes,
  useReadGnosisRouterSDai: () => useReadGnosisRouterSDai,
  useReadGnosisRouterSavingsXDaiAdapter: () => useReadGnosisRouterSavingsXDaiAdapter,
  useReadGnosisRouterSupportsInterface: () => useReadGnosisRouterSupportsInterface,
  useReadGnosisRouterWrapped1155Factory: () => useReadGnosisRouterWrapped1155Factory,
  useReadMainnetRouter: () => useReadMainnetRouter,
  useReadMainnetRouterConditionalTokens: () => useReadMainnetRouterConditionalTokens,
  useReadMainnetRouterDai: () => useReadMainnetRouterDai,
  useReadMainnetRouterGetTokenId: () => useReadMainnetRouterGetTokenId,
  useReadMainnetRouterGetWinningOutcomes: () => useReadMainnetRouterGetWinningOutcomes,
  useReadMainnetRouterSDai: () => useReadMainnetRouterSDai,
  useReadMainnetRouterSupportsInterface: () => useReadMainnetRouterSupportsInterface,
  useReadMainnetRouterWrapped1155Factory: () => useReadMainnetRouterWrapped1155Factory,
  useReadRouter: () => useReadRouter,
  useReadRouterConditionalTokens: () => useReadRouterConditionalTokens,
  useReadRouterGetTokenId: () => useReadRouterGetTokenId,
  useReadRouterGetWinningOutcomes: () => useReadRouterGetWinningOutcomes,
  useReadRouterSupportsInterface: () => useReadRouterSupportsInterface,
  useReadRouterWrapped1155Factory: () => useReadRouterWrapped1155Factory,
  useSimulateConditionalRouter: () => useSimulateConditionalRouter,
  useSimulateConditionalRouterMergePositions: () => useSimulateConditionalRouterMergePositions,
  useSimulateConditionalRouterOnErc1155BatchReceived: () => useSimulateConditionalRouterOnErc1155BatchReceived,
  useSimulateConditionalRouterOnErc1155Received: () => useSimulateConditionalRouterOnErc1155Received,
  useSimulateConditionalRouterRedeemConditionalToCollateral: () => useSimulateConditionalRouterRedeemConditionalToCollateral,
  useSimulateConditionalRouterRedeemPositions: () => useSimulateConditionalRouterRedeemPositions,
  useSimulateConditionalRouterSplitPosition: () => useSimulateConditionalRouterSplitPosition,
  useSimulateFutarchyRouter: () => useSimulateFutarchyRouter,
  useSimulateFutarchyRouterMergePositions: () => useSimulateFutarchyRouterMergePositions,
  useSimulateFutarchyRouterOnErc1155BatchReceived: () => useSimulateFutarchyRouterOnErc1155BatchReceived,
  useSimulateFutarchyRouterOnErc1155Received: () => useSimulateFutarchyRouterOnErc1155Received,
  useSimulateFutarchyRouterRedeemPositions: () => useSimulateFutarchyRouterRedeemPositions,
  useSimulateFutarchyRouterRedeemProposal: () => useSimulateFutarchyRouterRedeemProposal,
  useSimulateFutarchyRouterSplitPosition: () => useSimulateFutarchyRouterSplitPosition,
  useSimulateGnosisRouter: () => useSimulateGnosisRouter,
  useSimulateGnosisRouterMergePositions: () => useSimulateGnosisRouterMergePositions,
  useSimulateGnosisRouterMergeToBase: () => useSimulateGnosisRouterMergeToBase,
  useSimulateGnosisRouterOnErc1155BatchReceived: () => useSimulateGnosisRouterOnErc1155BatchReceived,
  useSimulateGnosisRouterOnErc1155Received: () => useSimulateGnosisRouterOnErc1155Received,
  useSimulateGnosisRouterRedeemPositions: () => useSimulateGnosisRouterRedeemPositions,
  useSimulateGnosisRouterRedeemToBase: () => useSimulateGnosisRouterRedeemToBase,
  useSimulateGnosisRouterSplitFromBase: () => useSimulateGnosisRouterSplitFromBase,
  useSimulateGnosisRouterSplitPosition: () => useSimulateGnosisRouterSplitPosition,
  useSimulateMainnetRouter: () => useSimulateMainnetRouter,
  useSimulateMainnetRouterMergePositions: () => useSimulateMainnetRouterMergePositions,
  useSimulateMainnetRouterMergeToDai: () => useSimulateMainnetRouterMergeToDai,
  useSimulateMainnetRouterOnErc1155BatchReceived: () => useSimulateMainnetRouterOnErc1155BatchReceived,
  useSimulateMainnetRouterOnErc1155Received: () => useSimulateMainnetRouterOnErc1155Received,
  useSimulateMainnetRouterRedeemPositions: () => useSimulateMainnetRouterRedeemPositions,
  useSimulateMainnetRouterRedeemToDai: () => useSimulateMainnetRouterRedeemToDai,
  useSimulateMainnetRouterSplitFromDai: () => useSimulateMainnetRouterSplitFromDai,
  useSimulateMainnetRouterSplitPosition: () => useSimulateMainnetRouterSplitPosition,
  useSimulateRouter: () => useSimulateRouter,
  useSimulateRouterMergePositions: () => useSimulateRouterMergePositions,
  useSimulateRouterOnErc1155BatchReceived: () => useSimulateRouterOnErc1155BatchReceived,
  useSimulateRouterOnErc1155Received: () => useSimulateRouterOnErc1155Received,
  useSimulateRouterRedeemPositions: () => useSimulateRouterRedeemPositions,
  useSimulateRouterSplitPosition: () => useSimulateRouterSplitPosition,
  useWriteConditionalRouter: () => useWriteConditionalRouter,
  useWriteConditionalRouterMergePositions: () => useWriteConditionalRouterMergePositions,
  useWriteConditionalRouterOnErc1155BatchReceived: () => useWriteConditionalRouterOnErc1155BatchReceived,
  useWriteConditionalRouterOnErc1155Received: () => useWriteConditionalRouterOnErc1155Received,
  useWriteConditionalRouterRedeemConditionalToCollateral: () => useWriteConditionalRouterRedeemConditionalToCollateral,
  useWriteConditionalRouterRedeemPositions: () => useWriteConditionalRouterRedeemPositions,
  useWriteConditionalRouterSplitPosition: () => useWriteConditionalRouterSplitPosition,
  useWriteFutarchyRouter: () => useWriteFutarchyRouter,
  useWriteFutarchyRouterMergePositions: () => useWriteFutarchyRouterMergePositions,
  useWriteFutarchyRouterOnErc1155BatchReceived: () => useWriteFutarchyRouterOnErc1155BatchReceived,
  useWriteFutarchyRouterOnErc1155Received: () => useWriteFutarchyRouterOnErc1155Received,
  useWriteFutarchyRouterRedeemPositions: () => useWriteFutarchyRouterRedeemPositions,
  useWriteFutarchyRouterRedeemProposal: () => useWriteFutarchyRouterRedeemProposal,
  useWriteFutarchyRouterSplitPosition: () => useWriteFutarchyRouterSplitPosition,
  useWriteGnosisRouter: () => useWriteGnosisRouter,
  useWriteGnosisRouterMergePositions: () => useWriteGnosisRouterMergePositions,
  useWriteGnosisRouterMergeToBase: () => useWriteGnosisRouterMergeToBase,
  useWriteGnosisRouterOnErc1155BatchReceived: () => useWriteGnosisRouterOnErc1155BatchReceived,
  useWriteGnosisRouterOnErc1155Received: () => useWriteGnosisRouterOnErc1155Received,
  useWriteGnosisRouterRedeemPositions: () => useWriteGnosisRouterRedeemPositions,
  useWriteGnosisRouterRedeemToBase: () => useWriteGnosisRouterRedeemToBase,
  useWriteGnosisRouterSplitFromBase: () => useWriteGnosisRouterSplitFromBase,
  useWriteGnosisRouterSplitPosition: () => useWriteGnosisRouterSplitPosition,
  useWriteMainnetRouter: () => useWriteMainnetRouter,
  useWriteMainnetRouterMergePositions: () => useWriteMainnetRouterMergePositions,
  useWriteMainnetRouterMergeToDai: () => useWriteMainnetRouterMergeToDai,
  useWriteMainnetRouterOnErc1155BatchReceived: () => useWriteMainnetRouterOnErc1155BatchReceived,
  useWriteMainnetRouterOnErc1155Received: () => useWriteMainnetRouterOnErc1155Received,
  useWriteMainnetRouterRedeemPositions: () => useWriteMainnetRouterRedeemPositions,
  useWriteMainnetRouterRedeemToDai: () => useWriteMainnetRouterRedeemToDai,
  useWriteMainnetRouterSplitFromDai: () => useWriteMainnetRouterSplitFromDai,
  useWriteMainnetRouterSplitPosition: () => useWriteMainnetRouterSplitPosition,
  useWriteRouter: () => useWriteRouter,
  useWriteRouterMergePositions: () => useWriteRouterMergePositions,
  useWriteRouterOnErc1155BatchReceived: () => useWriteRouterOnErc1155BatchReceived,
  useWriteRouterOnErc1155Received: () => useWriteRouterOnErc1155Received,
  useWriteRouterRedeemPositions: () => useWriteRouterRedeemPositions,
  useWriteRouterSplitPosition: () => useWriteRouterSplitPosition,
  writeConditionalRouter: () => writeConditionalRouter,
  writeConditionalRouterMergePositions: () => writeConditionalRouterMergePositions,
  writeConditionalRouterOnErc1155BatchReceived: () => writeConditionalRouterOnErc1155BatchReceived,
  writeConditionalRouterOnErc1155Received: () => writeConditionalRouterOnErc1155Received,
  writeConditionalRouterRedeemConditionalToCollateral: () => writeConditionalRouterRedeemConditionalToCollateral,
  writeConditionalRouterRedeemPositions: () => writeConditionalRouterRedeemPositions,
  writeConditionalRouterSplitPosition: () => writeConditionalRouterSplitPosition,
  writeFutarchyRouter: () => writeFutarchyRouter,
  writeFutarchyRouterMergePositions: () => writeFutarchyRouterMergePositions,
  writeFutarchyRouterOnErc1155BatchReceived: () => writeFutarchyRouterOnErc1155BatchReceived,
  writeFutarchyRouterOnErc1155Received: () => writeFutarchyRouterOnErc1155Received,
  writeFutarchyRouterRedeemPositions: () => writeFutarchyRouterRedeemPositions,
  writeFutarchyRouterRedeemProposal: () => writeFutarchyRouterRedeemProposal,
  writeFutarchyRouterSplitPosition: () => writeFutarchyRouterSplitPosition,
  writeGnosisRouter: () => writeGnosisRouter,
  writeGnosisRouterMergePositions: () => writeGnosisRouterMergePositions,
  writeGnosisRouterMergeToBase: () => writeGnosisRouterMergeToBase,
  writeGnosisRouterOnErc1155BatchReceived: () => writeGnosisRouterOnErc1155BatchReceived,
  writeGnosisRouterOnErc1155Received: () => writeGnosisRouterOnErc1155Received,
  writeGnosisRouterRedeemPositions: () => writeGnosisRouterRedeemPositions,
  writeGnosisRouterRedeemToBase: () => writeGnosisRouterRedeemToBase,
  writeGnosisRouterSplitFromBase: () => writeGnosisRouterSplitFromBase,
  writeGnosisRouterSplitPosition: () => writeGnosisRouterSplitPosition,
  writeMainnetRouter: () => writeMainnetRouter,
  writeMainnetRouterMergePositions: () => writeMainnetRouterMergePositions,
  writeMainnetRouterMergeToDai: () => writeMainnetRouterMergeToDai,
  writeMainnetRouterOnErc1155BatchReceived: () => writeMainnetRouterOnErc1155BatchReceived,
  writeMainnetRouterOnErc1155Received: () => writeMainnetRouterOnErc1155Received,
  writeMainnetRouterRedeemPositions: () => writeMainnetRouterRedeemPositions,
  writeMainnetRouterRedeemToDai: () => writeMainnetRouterRedeemToDai,
  writeMainnetRouterSplitFromDai: () => writeMainnetRouterSplitFromDai,
  writeMainnetRouterSplitPosition: () => writeMainnetRouterSplitPosition,
  writeRouter: () => writeRouter,
  writeRouterMergePositions: () => writeRouterMergePositions,
  writeRouterOnErc1155BatchReceived: () => writeRouterOnErc1155BatchReceived,
  writeRouterOnErc1155Received: () => writeRouterOnErc1155Received,
  writeRouterRedeemPositions: () => writeRouterRedeemPositions,
  writeRouterSplitPosition: () => writeRouterSplitPosition
});
module.exports = __toCommonJS(router_exports);
var import_codegen = require("wagmi/codegen");
var import_codegen2 = require("wagmi/codegen");
var conditionalRouterAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "indexSet", internalType: "uint256", type: "uint256" }
    ],
    name: "getTokenId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "conditionId", internalType: "bytes32", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", internalType: "bool[]", type: "bool[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      {
        name: "parentOutcomeIndexes",
        internalType: "uint256[]",
        type: "uint256[]"
      },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemConditionalToCollateral",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var conditionalRouterAddress = {
  1: "0x1BA2dB142a69B2D0b0EDbe666A9Bd457E344D9b5",
  10: "0x3124e97ebF4c9592A17d40E54623953Ff3c77a73",
  100: "0x774284d5cDFeC3A0a0eBc7283aD4d5b33013c29c",
  8453: "0xF5ccbf74121edBa492725F325D55356D517723B9",
  11155111: "0x73f98977ba13ad71275ba5bBA0189E9dC2dc42B5"
};
var conditionalRouterConfig = {
  address: conditionalRouterAddress,
  abi: conditionalRouterAbi
};
var futarchyRouterAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "indexSet", internalType: "uint256", type: "uint256" }
    ],
    name: "getTokenId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "conditionId", internalType: "bytes32", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", internalType: "bool[]", type: "bool[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "proposal",
        internalType: "contract FutarchyProposal",
        type: "address"
      },
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "proposal",
        internalType: "contract FutarchyProposal",
        type: "address"
      },
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "proposal",
        internalType: "contract FutarchyProposal",
        type: "address"
      },
      { name: "amount1", internalType: "uint256", type: "uint256" },
      { name: "amount2", internalType: "uint256", type: "uint256" }
    ],
    name: "redeemProposal",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "proposal",
        internalType: "contract FutarchyProposal",
        type: "address"
      },
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var futarchyRouterAddress = {
  100: "0xE2996f6BC88ba0f2Ad3a6E2A71ac55884ec9F74E"
};
var futarchyRouterConfig = {
  address: futarchyRouterAddress,
  abi: futarchyRouterAbi
};
var gnosisRouterAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "indexSet", internalType: "uint256", type: "uint256" }
    ],
    name: "getTokenId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "conditionId", internalType: "bytes32", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", internalType: "bool[]", type: "bool[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergeToBase",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemToBase",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "sDAI",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "savingsXDaiAdapter",
    outputs: [
      {
        name: "",
        internalType: "contract ISavingsXDaiAdapter",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" }
    ],
    name: "splitFromBase",
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var gnosisRouterAddress = {
  100: "0xeC9048b59b3467415b1a38F63416407eA0c70fB8"
};
var gnosisRouterConfig = {
  address: gnosisRouterAddress,
  abi: gnosisRouterAbi
};
var mainnetRouterAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "DAI",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "indexSet", internalType: "uint256", type: "uint256" }
    ],
    name: "getTokenId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "conditionId", internalType: "bytes32", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", internalType: "bool[]", type: "bool[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergeToDai",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemToDai",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "sDAI",
    outputs: [
      { name: "", internalType: "contract ISavingsDai", type: "address" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitFromDai",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var mainnetRouterAddress = {
  1: "0x886Ef0A78faBbAE942F1dA1791A8ed02a5aF8BC6"
};
var mainnetRouterConfig = {
  address: mainnetRouterAddress,
  abi: mainnetRouterAbi
};
var routerAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_conditionalTokens",
        internalType: "contract IConditionalTokens",
        type: "address"
      },
      {
        name: "_wrapped1155Factory",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [],
    name: "conditionalTokens",
    outputs: [
      {
        name: "",
        internalType: "contract IConditionalTokens",
        type: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "parentCollectionId", internalType: "bytes32", type: "bytes32" },
      { name: "conditionId", internalType: "bytes32", type: "bytes32" },
      { name: "indexSet", internalType: "uint256", type: "uint256" }
    ],
    name: "getTokenId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [{ name: "conditionId", internalType: "bytes32", type: "bytes32" }],
    name: "getWinningOutcomes",
    outputs: [{ name: "", internalType: "bool[]", type: "bool[]" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "uint256[]", type: "uint256[]" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "bytes", type: "bytes" }
    ],
    name: "onERC1155Received",
    outputs: [{ name: "", internalType: "bytes4", type: "bytes4" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "outcomeIndexes", internalType: "uint256[]", type: "uint256[]" },
      { name: "amounts", internalType: "uint256[]", type: "uint256[]" }
    ],
    name: "redeemPositions",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [
      {
        name: "collateralToken",
        internalType: "contract IERC20",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" }
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [],
    name: "wrapped1155Factory",
    outputs: [
      {
        name: "",
        internalType: "contract IWrapped1155Factory",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
];
var routerAddress = {
  10: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD",
  8453: "0x3124e97ebF4c9592A17d40E54623953Ff3c77a73",
  11155111: "0xdEB5dC052e55bf81C6d75CD47C961e0b280B3791"
};
var routerConfig = { address: routerAddress, abi: routerAbi };
var useReadConditionalRouter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var useReadConditionalRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "conditionalTokens"
});
var useReadConditionalRouterGetTokenId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "getTokenId"
});
var useReadConditionalRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "getWinningOutcomes"
});
var useReadConditionalRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "supportsInterface"
});
var useReadConditionalRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "wrapped1155Factory"
});
var useWriteConditionalRouter = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var useWriteConditionalRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "mergePositions"
});
var useWriteConditionalRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useWriteConditionalRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155Received"
});
var useWriteConditionalRouterRedeemConditionalToCollateral = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemConditionalToCollateral"
});
var useWriteConditionalRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemPositions"
});
var useWriteConditionalRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "splitPosition"
});
var useSimulateConditionalRouter = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var useSimulateConditionalRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "mergePositions"
});
var useSimulateConditionalRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useSimulateConditionalRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155Received"
});
var useSimulateConditionalRouterRedeemConditionalToCollateral = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemConditionalToCollateral"
});
var useSimulateConditionalRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemPositions"
});
var useSimulateConditionalRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "splitPosition"
});
var useReadFutarchyRouter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var useReadFutarchyRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "conditionalTokens"
});
var useReadFutarchyRouterGetTokenId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "getTokenId"
});
var useReadFutarchyRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "getWinningOutcomes"
});
var useReadFutarchyRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "supportsInterface"
});
var useReadFutarchyRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "wrapped1155Factory"
});
var useWriteFutarchyRouter = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var useWriteFutarchyRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "mergePositions"
});
var useWriteFutarchyRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useWriteFutarchyRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155Received"
});
var useWriteFutarchyRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemPositions"
});
var useWriteFutarchyRouterRedeemProposal = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemProposal"
});
var useWriteFutarchyRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "splitPosition"
});
var useSimulateFutarchyRouter = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var useSimulateFutarchyRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "mergePositions"
});
var useSimulateFutarchyRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useSimulateFutarchyRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155Received"
});
var useSimulateFutarchyRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemPositions"
});
var useSimulateFutarchyRouterRedeemProposal = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemProposal"
});
var useSimulateFutarchyRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "splitPosition"
});
var useReadGnosisRouter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var useReadGnosisRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "conditionalTokens"
});
var useReadGnosisRouterGetTokenId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "getTokenId"
});
var useReadGnosisRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "getWinningOutcomes"
});
var useReadGnosisRouterSDai = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "sDAI"
});
var useReadGnosisRouterSavingsXDaiAdapter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "savingsXDaiAdapter"
});
var useReadGnosisRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "supportsInterface"
});
var useReadGnosisRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "wrapped1155Factory"
});
var useWriteGnosisRouter = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var useWriteGnosisRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergePositions"
});
var useWriteGnosisRouterMergeToBase = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergeToBase"
});
var useWriteGnosisRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useWriteGnosisRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155Received"
});
var useWriteGnosisRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemPositions"
});
var useWriteGnosisRouterRedeemToBase = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemToBase"
});
var useWriteGnosisRouterSplitFromBase = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitFromBase"
});
var useWriteGnosisRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitPosition"
});
var useSimulateGnosisRouter = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var useSimulateGnosisRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergePositions"
});
var useSimulateGnosisRouterMergeToBase = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergeToBase"
});
var useSimulateGnosisRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useSimulateGnosisRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155Received"
});
var useSimulateGnosisRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemPositions"
});
var useSimulateGnosisRouterRedeemToBase = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemToBase"
});
var useSimulateGnosisRouterSplitFromBase = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitFromBase"
});
var useSimulateGnosisRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitPosition"
});
var useReadMainnetRouter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress
});
var useReadMainnetRouterDai = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "DAI"
});
var useReadMainnetRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "conditionalTokens"
});
var useReadMainnetRouterGetTokenId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "getTokenId"
});
var useReadMainnetRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "getWinningOutcomes"
});
var useReadMainnetRouterSDai = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "sDAI"
});
var useReadMainnetRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "supportsInterface"
});
var useReadMainnetRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "wrapped1155Factory"
});
var useWriteMainnetRouter = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress
});
var useWriteMainnetRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergePositions"
});
var useWriteMainnetRouterMergeToDai = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergeToDai"
});
var useWriteMainnetRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useWriteMainnetRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155Received"
});
var useWriteMainnetRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemPositions"
});
var useWriteMainnetRouterRedeemToDai = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemToDai"
});
var useWriteMainnetRouterSplitFromDai = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitFromDai"
});
var useWriteMainnetRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitPosition"
});
var useSimulateMainnetRouter = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)(
  { abi: mainnetRouterAbi, address: mainnetRouterAddress }
);
var useSimulateMainnetRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergePositions"
});
var useSimulateMainnetRouterMergeToDai = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergeToDai"
});
var useSimulateMainnetRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var useSimulateMainnetRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155Received"
});
var useSimulateMainnetRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemPositions"
});
var useSimulateMainnetRouterRedeemToDai = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemToDai"
});
var useSimulateMainnetRouterSplitFromDai = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitFromDai"
});
var useSimulateMainnetRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitPosition"
});
var useReadRouter = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress
});
var useReadRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "conditionalTokens"
});
var useReadRouterGetTokenId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "getTokenId"
});
var useReadRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "getWinningOutcomes"
});
var useReadRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "supportsInterface"
});
var useReadRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "wrapped1155Factory"
});
var useWriteRouter = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: routerAbi,
  address: routerAddress
});
var useWriteRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "mergePositions"
});
var useWriteRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155BatchReceived"
});
var useWriteRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155Received"
});
var useWriteRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "redeemPositions"
});
var useWriteRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseWriteContract)(
  { abi: routerAbi, address: routerAddress, functionName: "splitPosition" }
);
var useSimulateRouter = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress
});
var useSimulateRouterMergePositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "mergePositions"
});
var useSimulateRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155BatchReceived"
});
var useSimulateRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155Received"
});
var useSimulateRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "redeemPositions"
});
var useSimulateRouterSplitPosition = /* @__PURE__ */ (0, import_codegen.createUseSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "splitPosition"
});
var readConditionalRouter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var readConditionalRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "conditionalTokens"
});
var readConditionalRouterGetTokenId = /* @__PURE__ */ (0, import_codegen2.createReadContract)(
  {
    abi: conditionalRouterAbi,
    address: conditionalRouterAddress,
    functionName: "getTokenId"
  }
);
var readConditionalRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "getWinningOutcomes"
});
var readConditionalRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "supportsInterface"
});
var readConditionalRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "wrapped1155Factory"
});
var writeConditionalRouter = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var writeConditionalRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "mergePositions"
});
var writeConditionalRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var writeConditionalRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155Received"
});
var writeConditionalRouterRedeemConditionalToCollateral = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemConditionalToCollateral"
});
var writeConditionalRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemPositions"
});
var writeConditionalRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "splitPosition"
});
var simulateConditionalRouter = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress
});
var simulateConditionalRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "mergePositions"
});
var simulateConditionalRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var simulateConditionalRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "onERC1155Received"
});
var simulateConditionalRouterRedeemConditionalToCollateral = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemConditionalToCollateral"
});
var simulateConditionalRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "redeemPositions"
});
var simulateConditionalRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: conditionalRouterAbi,
  address: conditionalRouterAddress,
  functionName: "splitPosition"
});
var readFutarchyRouter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var readFutarchyRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "conditionalTokens"
});
var readFutarchyRouterGetTokenId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "getTokenId"
});
var readFutarchyRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "getWinningOutcomes"
});
var readFutarchyRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "supportsInterface"
});
var readFutarchyRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "wrapped1155Factory"
});
var writeFutarchyRouter = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var writeFutarchyRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "mergePositions"
});
var writeFutarchyRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var writeFutarchyRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155Received"
});
var writeFutarchyRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemPositions"
});
var writeFutarchyRouterRedeemProposal = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemProposal"
});
var writeFutarchyRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "splitPosition"
});
var simulateFutarchyRouter = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress
});
var simulateFutarchyRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "mergePositions"
});
var simulateFutarchyRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var simulateFutarchyRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "onERC1155Received"
});
var simulateFutarchyRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemPositions"
});
var simulateFutarchyRouterRedeemProposal = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "redeemProposal"
});
var simulateFutarchyRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: futarchyRouterAbi,
  address: futarchyRouterAddress,
  functionName: "splitPosition"
});
var readGnosisRouter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var readGnosisRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "conditionalTokens"
});
var readGnosisRouterGetTokenId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "getTokenId"
});
var readGnosisRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "getWinningOutcomes"
});
var readGnosisRouterSDai = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "sDAI"
});
var readGnosisRouterSavingsXDaiAdapter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "savingsXDaiAdapter"
});
var readGnosisRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "supportsInterface"
});
var readGnosisRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "wrapped1155Factory"
});
var writeGnosisRouter = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var writeGnosisRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergePositions"
});
var writeGnosisRouterMergeToBase = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergeToBase"
});
var writeGnosisRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var writeGnosisRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155Received"
});
var writeGnosisRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemPositions"
});
var writeGnosisRouterRedeemToBase = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemToBase"
});
var writeGnosisRouterSplitFromBase = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: "splitFromBase"
  }
);
var writeGnosisRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: gnosisRouterAbi,
    address: gnosisRouterAddress,
    functionName: "splitPosition"
  }
);
var simulateGnosisRouter = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress
});
var simulateGnosisRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergePositions"
});
var simulateGnosisRouterMergeToBase = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "mergeToBase"
});
var simulateGnosisRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var simulateGnosisRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "onERC1155Received"
});
var simulateGnosisRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemPositions"
});
var simulateGnosisRouterRedeemToBase = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "redeemToBase"
});
var simulateGnosisRouterSplitFromBase = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitFromBase"
});
var simulateGnosisRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: gnosisRouterAbi,
  address: gnosisRouterAddress,
  functionName: "splitPosition"
});
var readMainnetRouter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress
});
var readMainnetRouterDai = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "DAI"
});
var readMainnetRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "conditionalTokens"
});
var readMainnetRouterGetTokenId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "getTokenId"
});
var readMainnetRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "getWinningOutcomes"
});
var readMainnetRouterSDai = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "sDAI"
});
var readMainnetRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "supportsInterface"
});
var readMainnetRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "wrapped1155Factory"
});
var writeMainnetRouter = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress
});
var writeMainnetRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergePositions"
});
var writeMainnetRouterMergeToDai = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergeToDai"
});
var writeMainnetRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var writeMainnetRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155Received"
});
var writeMainnetRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemPositions"
});
var writeMainnetRouterRedeemToDai = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemToDai"
});
var writeMainnetRouterSplitFromDai = /* @__PURE__ */ (0, import_codegen2.createWriteContract)(
  {
    abi: mainnetRouterAbi,
    address: mainnetRouterAddress,
    functionName: "splitFromDai"
  }
);
var writeMainnetRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitPosition"
});
var simulateMainnetRouter = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress
});
var simulateMainnetRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergePositions"
});
var simulateMainnetRouterMergeToDai = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "mergeToDai"
});
var simulateMainnetRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155BatchReceived"
});
var simulateMainnetRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "onERC1155Received"
});
var simulateMainnetRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemPositions"
});
var simulateMainnetRouterRedeemToDai = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "redeemToDai"
});
var simulateMainnetRouterSplitFromDai = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitFromDai"
});
var simulateMainnetRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: mainnetRouterAbi,
  address: mainnetRouterAddress,
  functionName: "splitPosition"
});
var readRouter = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress
});
var readRouterConditionalTokens = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "conditionalTokens"
});
var readRouterGetTokenId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "getTokenId"
});
var readRouterGetWinningOutcomes = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "getWinningOutcomes"
});
var readRouterSupportsInterface = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "supportsInterface"
});
var readRouterWrapped1155Factory = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "wrapped1155Factory"
});
var writeRouter = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress
});
var writeRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "mergePositions"
});
var writeRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155BatchReceived"
});
var writeRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155Received"
});
var writeRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "redeemPositions"
});
var writeRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createWriteContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "splitPosition"
});
var simulateRouter = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: routerAbi,
  address: routerAddress
});
var simulateRouterMergePositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "mergePositions"
});
var simulateRouterOnErc1155BatchReceived = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155BatchReceived"
});
var simulateRouterOnErc1155Received = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "onERC1155Received"
});
var simulateRouterRedeemPositions = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)({
  abi: routerAbi,
  address: routerAddress,
  functionName: "redeemPositions"
});
var simulateRouterSplitPosition = /* @__PURE__ */ (0, import_codegen2.createSimulateContract)(
  { abi: routerAbi, address: routerAddress, functionName: "splitPosition" }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  conditionalRouterAbi,
  conditionalRouterAddress,
  conditionalRouterConfig,
  futarchyRouterAbi,
  futarchyRouterAddress,
  futarchyRouterConfig,
  gnosisRouterAbi,
  gnosisRouterAddress,
  gnosisRouterConfig,
  mainnetRouterAbi,
  mainnetRouterAddress,
  mainnetRouterConfig,
  readConditionalRouter,
  readConditionalRouterConditionalTokens,
  readConditionalRouterGetTokenId,
  readConditionalRouterGetWinningOutcomes,
  readConditionalRouterSupportsInterface,
  readConditionalRouterWrapped1155Factory,
  readFutarchyRouter,
  readFutarchyRouterConditionalTokens,
  readFutarchyRouterGetTokenId,
  readFutarchyRouterGetWinningOutcomes,
  readFutarchyRouterSupportsInterface,
  readFutarchyRouterWrapped1155Factory,
  readGnosisRouter,
  readGnosisRouterConditionalTokens,
  readGnosisRouterGetTokenId,
  readGnosisRouterGetWinningOutcomes,
  readGnosisRouterSDai,
  readGnosisRouterSavingsXDaiAdapter,
  readGnosisRouterSupportsInterface,
  readGnosisRouterWrapped1155Factory,
  readMainnetRouter,
  readMainnetRouterConditionalTokens,
  readMainnetRouterDai,
  readMainnetRouterGetTokenId,
  readMainnetRouterGetWinningOutcomes,
  readMainnetRouterSDai,
  readMainnetRouterSupportsInterface,
  readMainnetRouterWrapped1155Factory,
  readRouter,
  readRouterConditionalTokens,
  readRouterGetTokenId,
  readRouterGetWinningOutcomes,
  readRouterSupportsInterface,
  readRouterWrapped1155Factory,
  routerAbi,
  routerAddress,
  routerConfig,
  simulateConditionalRouter,
  simulateConditionalRouterMergePositions,
  simulateConditionalRouterOnErc1155BatchReceived,
  simulateConditionalRouterOnErc1155Received,
  simulateConditionalRouterRedeemConditionalToCollateral,
  simulateConditionalRouterRedeemPositions,
  simulateConditionalRouterSplitPosition,
  simulateFutarchyRouter,
  simulateFutarchyRouterMergePositions,
  simulateFutarchyRouterOnErc1155BatchReceived,
  simulateFutarchyRouterOnErc1155Received,
  simulateFutarchyRouterRedeemPositions,
  simulateFutarchyRouterRedeemProposal,
  simulateFutarchyRouterSplitPosition,
  simulateGnosisRouter,
  simulateGnosisRouterMergePositions,
  simulateGnosisRouterMergeToBase,
  simulateGnosisRouterOnErc1155BatchReceived,
  simulateGnosisRouterOnErc1155Received,
  simulateGnosisRouterRedeemPositions,
  simulateGnosisRouterRedeemToBase,
  simulateGnosisRouterSplitFromBase,
  simulateGnosisRouterSplitPosition,
  simulateMainnetRouter,
  simulateMainnetRouterMergePositions,
  simulateMainnetRouterMergeToDai,
  simulateMainnetRouterOnErc1155BatchReceived,
  simulateMainnetRouterOnErc1155Received,
  simulateMainnetRouterRedeemPositions,
  simulateMainnetRouterRedeemToDai,
  simulateMainnetRouterSplitFromDai,
  simulateMainnetRouterSplitPosition,
  simulateRouter,
  simulateRouterMergePositions,
  simulateRouterOnErc1155BatchReceived,
  simulateRouterOnErc1155Received,
  simulateRouterRedeemPositions,
  simulateRouterSplitPosition,
  useReadConditionalRouter,
  useReadConditionalRouterConditionalTokens,
  useReadConditionalRouterGetTokenId,
  useReadConditionalRouterGetWinningOutcomes,
  useReadConditionalRouterSupportsInterface,
  useReadConditionalRouterWrapped1155Factory,
  useReadFutarchyRouter,
  useReadFutarchyRouterConditionalTokens,
  useReadFutarchyRouterGetTokenId,
  useReadFutarchyRouterGetWinningOutcomes,
  useReadFutarchyRouterSupportsInterface,
  useReadFutarchyRouterWrapped1155Factory,
  useReadGnosisRouter,
  useReadGnosisRouterConditionalTokens,
  useReadGnosisRouterGetTokenId,
  useReadGnosisRouterGetWinningOutcomes,
  useReadGnosisRouterSDai,
  useReadGnosisRouterSavingsXDaiAdapter,
  useReadGnosisRouterSupportsInterface,
  useReadGnosisRouterWrapped1155Factory,
  useReadMainnetRouter,
  useReadMainnetRouterConditionalTokens,
  useReadMainnetRouterDai,
  useReadMainnetRouterGetTokenId,
  useReadMainnetRouterGetWinningOutcomes,
  useReadMainnetRouterSDai,
  useReadMainnetRouterSupportsInterface,
  useReadMainnetRouterWrapped1155Factory,
  useReadRouter,
  useReadRouterConditionalTokens,
  useReadRouterGetTokenId,
  useReadRouterGetWinningOutcomes,
  useReadRouterSupportsInterface,
  useReadRouterWrapped1155Factory,
  useSimulateConditionalRouter,
  useSimulateConditionalRouterMergePositions,
  useSimulateConditionalRouterOnErc1155BatchReceived,
  useSimulateConditionalRouterOnErc1155Received,
  useSimulateConditionalRouterRedeemConditionalToCollateral,
  useSimulateConditionalRouterRedeemPositions,
  useSimulateConditionalRouterSplitPosition,
  useSimulateFutarchyRouter,
  useSimulateFutarchyRouterMergePositions,
  useSimulateFutarchyRouterOnErc1155BatchReceived,
  useSimulateFutarchyRouterOnErc1155Received,
  useSimulateFutarchyRouterRedeemPositions,
  useSimulateFutarchyRouterRedeemProposal,
  useSimulateFutarchyRouterSplitPosition,
  useSimulateGnosisRouter,
  useSimulateGnosisRouterMergePositions,
  useSimulateGnosisRouterMergeToBase,
  useSimulateGnosisRouterOnErc1155BatchReceived,
  useSimulateGnosisRouterOnErc1155Received,
  useSimulateGnosisRouterRedeemPositions,
  useSimulateGnosisRouterRedeemToBase,
  useSimulateGnosisRouterSplitFromBase,
  useSimulateGnosisRouterSplitPosition,
  useSimulateMainnetRouter,
  useSimulateMainnetRouterMergePositions,
  useSimulateMainnetRouterMergeToDai,
  useSimulateMainnetRouterOnErc1155BatchReceived,
  useSimulateMainnetRouterOnErc1155Received,
  useSimulateMainnetRouterRedeemPositions,
  useSimulateMainnetRouterRedeemToDai,
  useSimulateMainnetRouterSplitFromDai,
  useSimulateMainnetRouterSplitPosition,
  useSimulateRouter,
  useSimulateRouterMergePositions,
  useSimulateRouterOnErc1155BatchReceived,
  useSimulateRouterOnErc1155Received,
  useSimulateRouterRedeemPositions,
  useSimulateRouterSplitPosition,
  useWriteConditionalRouter,
  useWriteConditionalRouterMergePositions,
  useWriteConditionalRouterOnErc1155BatchReceived,
  useWriteConditionalRouterOnErc1155Received,
  useWriteConditionalRouterRedeemConditionalToCollateral,
  useWriteConditionalRouterRedeemPositions,
  useWriteConditionalRouterSplitPosition,
  useWriteFutarchyRouter,
  useWriteFutarchyRouterMergePositions,
  useWriteFutarchyRouterOnErc1155BatchReceived,
  useWriteFutarchyRouterOnErc1155Received,
  useWriteFutarchyRouterRedeemPositions,
  useWriteFutarchyRouterRedeemProposal,
  useWriteFutarchyRouterSplitPosition,
  useWriteGnosisRouter,
  useWriteGnosisRouterMergePositions,
  useWriteGnosisRouterMergeToBase,
  useWriteGnosisRouterOnErc1155BatchReceived,
  useWriteGnosisRouterOnErc1155Received,
  useWriteGnosisRouterRedeemPositions,
  useWriteGnosisRouterRedeemToBase,
  useWriteGnosisRouterSplitFromBase,
  useWriteGnosisRouterSplitPosition,
  useWriteMainnetRouter,
  useWriteMainnetRouterMergePositions,
  useWriteMainnetRouterMergeToDai,
  useWriteMainnetRouterOnErc1155BatchReceived,
  useWriteMainnetRouterOnErc1155Received,
  useWriteMainnetRouterRedeemPositions,
  useWriteMainnetRouterRedeemToDai,
  useWriteMainnetRouterSplitFromDai,
  useWriteMainnetRouterSplitPosition,
  useWriteRouter,
  useWriteRouterMergePositions,
  useWriteRouterOnErc1155BatchReceived,
  useWriteRouterOnErc1155Received,
  useWriteRouterRedeemPositions,
  useWriteRouterSplitPosition,
  writeConditionalRouter,
  writeConditionalRouterMergePositions,
  writeConditionalRouterOnErc1155BatchReceived,
  writeConditionalRouterOnErc1155Received,
  writeConditionalRouterRedeemConditionalToCollateral,
  writeConditionalRouterRedeemPositions,
  writeConditionalRouterSplitPosition,
  writeFutarchyRouter,
  writeFutarchyRouterMergePositions,
  writeFutarchyRouterOnErc1155BatchReceived,
  writeFutarchyRouterOnErc1155Received,
  writeFutarchyRouterRedeemPositions,
  writeFutarchyRouterRedeemProposal,
  writeFutarchyRouterSplitPosition,
  writeGnosisRouter,
  writeGnosisRouterMergePositions,
  writeGnosisRouterMergeToBase,
  writeGnosisRouterOnErc1155BatchReceived,
  writeGnosisRouterOnErc1155Received,
  writeGnosisRouterRedeemPositions,
  writeGnosisRouterRedeemToBase,
  writeGnosisRouterSplitFromBase,
  writeGnosisRouterSplitPosition,
  writeMainnetRouter,
  writeMainnetRouterMergePositions,
  writeMainnetRouterMergeToDai,
  writeMainnetRouterOnErc1155BatchReceived,
  writeMainnetRouterOnErc1155Received,
  writeMainnetRouterRedeemPositions,
  writeMainnetRouterRedeemToDai,
  writeMainnetRouterSplitFromDai,
  writeMainnetRouterSplitPosition,
  writeRouter,
  writeRouterMergePositions,
  writeRouterOnErc1155BatchReceived,
  writeRouterOnErc1155Received,
  writeRouterRedeemPositions,
  writeRouterSplitPosition
});
