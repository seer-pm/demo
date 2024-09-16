import { ethers } from "hardhat";
export const GnosisAddress = {
  RPC_URL: process.env.GNOSIS_RPC || "https://gnosis-pokt.nodies.app",
  ARBITRATOR: "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd",
  REALITIO: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  CONDITIONAL_TOKENS: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
  COLLATERAL_TOKEN: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
  WRAPPED_1155_FACTORY: "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f",
  S_DAI: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
  S_DAI_ADAPTER: "0xD499b51fcFc66bd31248ef4b28d656d67E591A94",
  X_DAI: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  W_X_DAI: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  SWAPR_QUOTER: "0xcBaD9FDf0D2814659Eb26f600EFDeAF005Eda0F7",
  SWAPR_ROUTER: "0xfFB643E73f280B97809A8b41f7232AB401a04ee1",
  WXDAI_SDAI_WHALE: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
};

export const MainnetAddress = {
  RPC_URL: "https://eth-pokt.nodies.app",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  S_DAI: "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
  WHALE: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf", //Polygon (Matic): ERC20 Bridge
};

export const MIN_BOND = "5"; //ethers
export const ETH_BALANCE = "1000"; //ethers
export const SPLIT_AMOUNT = "10"; //ethers
export const CONDITIONAL_SPLIT_AMOUNT = String(Number(SPLIT_AMOUNT) / 4 * 3);
export const MERGE_AMOUNT = String(Number(SPLIT_AMOUNT) / 3);
export const DELTA = ethers.parseEther(SPLIT_AMOUNT) / BigInt(1e4); //+- 0.01%

export const QUESTION_TIMEOUT = 60 * 60 * 24 * 3.5; //seconds

export const OPENING_TS = 60 * 60; // seconds

export const EMPTY_PARENT_COLLECTION_ID = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const INVALID_RESULT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ANSWERED_TOO_SOON = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export const REALITY_SINGLE_SELECT_TEMPLATE = 2;

export const categoricalMarketParams = {
  marketName: "Will it rain tomorrow?",
  encodedQuestions: ['Will it rain tomorrow?␟"Yes","No"␟misc␟en_US'],
  questionStart: "",
  questionEnd: "",
  outcomeType: "",
  parentOutcome: 0,
  parentMarket: ethers.ZeroAddress,
  category: "misc",
  lang: "en_US",
  outcomes: ["Yes", "No"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["YES", "NO"],
};

export const multiCategoricalMarketParams = {
  marketName: "Which color will win?",
  encodedQuestions: ['Which color will win?␟"Red","Blue","Green"␟misc␟en_US'],
  questionStart: "",
  questionEnd: "",
  outcomeType: "",
  parentOutcome: 0,
  parentMarket: ethers.ZeroAddress,
  category: "misc",
  lang: "en_US",
  outcomes: ["Red", "Blue", "Green"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["RED", "BLUE", "GREEN"],
};

export const scalarMarketParams = {
  marketName: "What will the temperature be tomorrow?",
  encodedQuestions: ["What will the temperature be tomorrow?␟misc␟en_US"],
  questionStart: "",
  questionEnd: "",
  outcomeType: "",
  parentOutcome: 0,
  parentMarket: ethers.ZeroAddress,
  category: "misc",
  lang: "en_US",
  outcomes: ["Lower", "Higher"],
  lowerBound: 20,
  upperBound: 100,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["LOWER", "HIGHER"],
};

export const multiScalarMarketParams = {
  marketName: "What will the temperature be in [city]?",
  encodedQuestions: [
    "What will the temperature be in New York?␟misc␟en_US",
    "What will the temperature be in London?␟misc␟en_US",
  ],
  questionStart: "What will the temperature be in ",
  questionEnd: "?",
  outcomeType: "city",
  parentOutcome: 0,
  parentMarket: ethers.ZeroAddress,
  category: "misc",
  lang: "en_US",
  outcomes: ["New York", "London"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["NY_TEMP", "LON_TEMP"],
};
