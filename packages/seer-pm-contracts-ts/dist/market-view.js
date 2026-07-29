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

// generated/contracts/market-view.ts
var market_view_exports = {};
__export(market_view_exports, {
  marketViewAbi: () => marketViewAbi,
  marketViewAddress: () => marketViewAddress,
  marketViewConfig: () => marketViewConfig,
  readMarketView: () => readMarketView,
  readMarketViewGetMarket: () => readMarketViewGetMarket,
  readMarketViewGetMarkets: () => readMarketViewGetMarkets,
  readMarketViewGetQuestionId: () => readMarketViewGetQuestionId,
  useReadMarketView: () => useReadMarketView,
  useReadMarketViewGetMarket: () => useReadMarketViewGetMarket,
  useReadMarketViewGetMarkets: () => useReadMarketViewGetMarkets,
  useReadMarketViewGetQuestionId: () => useReadMarketViewGetQuestionId
});
module.exports = __toCommonJS(market_view_exports);
var import_codegen = require("wagmi/codegen");
var import_codegen2 = require("wagmi/codegen");
var marketViewAbi = [
  {
    type: "function",
    inputs: [
      {
        name: "marketFactory",
        internalType: "contract IMarketFactory",
        type: "address"
      },
      { name: "market", internalType: "contract Market", type: "address" }
    ],
    name: "getMarket",
    outputs: [
      {
        name: "",
        internalType: "struct MarketView.MarketInfo",
        type: "tuple",
        components: [
          { name: "id", internalType: "address", type: "address" },
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          {
            name: "parentMarket",
            internalType: "struct MarketView.ParentMarketInfo",
            type: "tuple",
            components: [
              { name: "id", internalType: "address", type: "address" },
              { name: "marketName", internalType: "string", type: "string" },
              { name: "outcomes", internalType: "string[]", type: "string[]" },
              {
                name: "wrappedTokens",
                internalType: "address[]",
                type: "address[]"
              },
              { name: "conditionId", internalType: "bytes32", type: "bytes32" },
              { name: "payoutReported", internalType: "bool", type: "bool" },
              {
                name: "payoutNumerators",
                internalType: "uint256[]",
                type: "uint256[]"
              }
            ]
          },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "collateralToken", internalType: "address", type: "address" },
          {
            name: "wrappedTokens",
            internalType: "address[]",
            type: "address[]"
          },
          { name: "outcomesSupply", internalType: "uint256", type: "uint256" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          {
            name: "parentCollectionId",
            internalType: "bytes32",
            type: "bytes32"
          },
          {
            name: "collateralToken1",
            internalType: "address",
            type: "address"
          },
          {
            name: "collateralToken2",
            internalType: "address",
            type: "address"
          },
          { name: "conditionId", internalType: "bytes32", type: "bytes32" },
          { name: "questionId", internalType: "bytes32", type: "bytes32" },
          { name: "templateId", internalType: "uint256", type: "uint256" },
          {
            name: "questions",
            internalType: "struct IRealityETH_v3_0.Question[]",
            type: "tuple[]",
            components: [
              {
                name: "content_hash",
                internalType: "bytes32",
                type: "bytes32"
              },
              { name: "arbitrator", internalType: "address", type: "address" },
              { name: "opening_ts", internalType: "uint32", type: "uint32" },
              { name: "timeout", internalType: "uint32", type: "uint32" },
              { name: "finalize_ts", internalType: "uint32", type: "uint32" },
              {
                name: "is_pending_arbitration",
                internalType: "bool",
                type: "bool"
              },
              { name: "bounty", internalType: "uint256", type: "uint256" },
              { name: "best_answer", internalType: "bytes32", type: "bytes32" },
              {
                name: "history_hash",
                internalType: "bytes32",
                type: "bytes32"
              },
              { name: "bond", internalType: "uint256", type: "uint256" },
              { name: "min_bond", internalType: "uint256", type: "uint256" }
            ]
          },
          {
            name: "questionsIds",
            internalType: "bytes32[]",
            type: "bytes32[]"
          },
          {
            name: "encodedQuestions",
            internalType: "string[]",
            type: "string[]"
          },
          { name: "payoutReported", internalType: "bool", type: "bool" },
          {
            name: "payoutNumerators",
            internalType: "uint256[]",
            type: "uint256[]"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "count", internalType: "uint256", type: "uint256" },
      {
        name: "marketFactory",
        internalType: "contract IMarketFactory",
        type: "address"
      }
    ],
    name: "getMarkets",
    outputs: [
      {
        name: "",
        internalType: "struct MarketView.MarketInfo[]",
        type: "tuple[]",
        components: [
          { name: "id", internalType: "address", type: "address" },
          { name: "marketName", internalType: "string", type: "string" },
          { name: "outcomes", internalType: "string[]", type: "string[]" },
          {
            name: "parentMarket",
            internalType: "struct MarketView.ParentMarketInfo",
            type: "tuple",
            components: [
              { name: "id", internalType: "address", type: "address" },
              { name: "marketName", internalType: "string", type: "string" },
              { name: "outcomes", internalType: "string[]", type: "string[]" },
              {
                name: "wrappedTokens",
                internalType: "address[]",
                type: "address[]"
              },
              { name: "conditionId", internalType: "bytes32", type: "bytes32" },
              { name: "payoutReported", internalType: "bool", type: "bool" },
              {
                name: "payoutNumerators",
                internalType: "uint256[]",
                type: "uint256[]"
              }
            ]
          },
          { name: "parentOutcome", internalType: "uint256", type: "uint256" },
          { name: "collateralToken", internalType: "address", type: "address" },
          {
            name: "wrappedTokens",
            internalType: "address[]",
            type: "address[]"
          },
          { name: "outcomesSupply", internalType: "uint256", type: "uint256" },
          { name: "lowerBound", internalType: "uint256", type: "uint256" },
          { name: "upperBound", internalType: "uint256", type: "uint256" },
          {
            name: "parentCollectionId",
            internalType: "bytes32",
            type: "bytes32"
          },
          {
            name: "collateralToken1",
            internalType: "address",
            type: "address"
          },
          {
            name: "collateralToken2",
            internalType: "address",
            type: "address"
          },
          { name: "conditionId", internalType: "bytes32", type: "bytes32" },
          { name: "questionId", internalType: "bytes32", type: "bytes32" },
          { name: "templateId", internalType: "uint256", type: "uint256" },
          {
            name: "questions",
            internalType: "struct IRealityETH_v3_0.Question[]",
            type: "tuple[]",
            components: [
              {
                name: "content_hash",
                internalType: "bytes32",
                type: "bytes32"
              },
              { name: "arbitrator", internalType: "address", type: "address" },
              { name: "opening_ts", internalType: "uint32", type: "uint32" },
              { name: "timeout", internalType: "uint32", type: "uint32" },
              { name: "finalize_ts", internalType: "uint32", type: "uint32" },
              {
                name: "is_pending_arbitration",
                internalType: "bool",
                type: "bool"
              },
              { name: "bounty", internalType: "uint256", type: "uint256" },
              { name: "best_answer", internalType: "bytes32", type: "bytes32" },
              {
                name: "history_hash",
                internalType: "bytes32",
                type: "bytes32"
              },
              { name: "bond", internalType: "uint256", type: "uint256" },
              { name: "min_bond", internalType: "uint256", type: "uint256" }
            ]
          },
          {
            name: "questionsIds",
            internalType: "bytes32[]",
            type: "bytes32[]"
          },
          {
            name: "encodedQuestions",
            internalType: "string[]",
            type: "string[]"
          },
          { name: "payoutReported", internalType: "bool", type: "bool" },
          {
            name: "payoutNumerators",
            internalType: "uint256[]",
            type: "uint256[]"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    inputs: [
      { name: "questionId", internalType: "bytes32", type: "bytes32" },
      {
        name: "realitio",
        internalType: "contract IRealityETH_v3_0",
        type: "address"
      }
    ],
    name: "getQuestionId",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view"
  }
];
var marketViewAddress = {
  1: "0xB2aB74afe47e6f9D8c392FA15b139Ac02684771a",
  10: "0x44921b4c7510Fb306d8E58cF3894fA2bc8a79F00",
  100: "0x95493F3e3F151eD9ee9338a4Fc1f49c00890F59C",
  8453: "0x179d8F8c811B8C759c33809dbc6c5ceDc62D05DD",
  11155111: "0xcBBbABD15895ae7b2e28BE6f250729098F1c69FA"
};
var marketViewConfig = {
  address: marketViewAddress,
  abi: marketViewAbi
};
var useReadMarketView = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress
});
var useReadMarketViewGetMarket = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getMarket"
});
var useReadMarketViewGetMarkets = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getMarkets"
});
var useReadMarketViewGetQuestionId = /* @__PURE__ */ (0, import_codegen.createUseReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getQuestionId"
});
var readMarketView = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress
});
var readMarketViewGetMarket = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getMarket"
});
var readMarketViewGetMarkets = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getMarkets"
});
var readMarketViewGetQuestionId = /* @__PURE__ */ (0, import_codegen2.createReadContract)({
  abi: marketViewAbi,
  address: marketViewAddress,
  functionName: "getQuestionId"
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  marketViewAbi,
  marketViewAddress,
  marketViewConfig,
  readMarketView,
  readMarketViewGetMarket,
  readMarketViewGetMarkets,
  readMarketViewGetQuestionId,
  useReadMarketView,
  useReadMarketViewGetMarket,
  useReadMarketViewGetMarkets,
  useReadMarketViewGetQuestionId
});
