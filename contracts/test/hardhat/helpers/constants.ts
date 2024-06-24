import { ethers } from "hardhat";
export const GnosisAddress = {
  RPC_URL: "https://gnosis-pokt.nodies.app",
  ARBITRATOR: "0xe40DD83a262da3f56976038F1554Fe541Fa75ecd",
  REALITIO: "0xE78996A233895bE74a66F451f1019cA9734205cc",
  CONDITIONAL_TOKENS: "0xCeAfDD6bc0bEF976fdCd1112955828E00543c0Ce",
  COLLATERAL_TOKEN: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
  WRAPPED_1155_FACTORY: "0xD194319D1804C1051DD21Ba1Dc931cA72410B79f",
  S_DAI: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
  S_DAI_ADAPTER: "0xD499b51fcFc66bd31248ef4b28d656d67E591A94",
};

export const MainnetAddress = {
  RPC_URL: "https://eth-pokt.nodies.app",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  S_DAI: "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
  WHALE: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf", //Polygon (Matic): ERC20 Bridge
};

export const MIN_BOND = "5"; //ethers
export const ETH_BALANCE = '1000' //ethers
export const POSITION_AMOUNT = "10"; //ethers
export const DELTA = ethers.parseEther(POSITION_AMOUNT) / BigInt(1e8); //wei

export const TIMEOUT = 60 * 60 * 24 * 1.5; //seconds

export const OPENING_TS = 60 * 60; // seconds

export const PARENT_COLLECTION_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const INVALID_RESULT =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const ANSWERED_TOO_SOON =
  "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export const REALITY_SINGLE_SELECT_TEMPLATE = 2;

export const categoricalMarketParams = {
  marketName: "Test Categorical Market",
  encodedQuestions: ["Will it rain tomorrow?"],
  outcomes: ["Yes", "No"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["YES", "NO"],
};

export const multiCategoricalMarketParams = {
  marketName: "Test Multi-Categorical Market",
  encodedQuestions: ["Which color will win?"],
  outcomes: ["Red", "Blue", "Green"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["RED", "BLUE", "GREEN"],
};

export const scalarMarketParams = {
  marketName: "Test Scalar Market",
  encodedQuestions: ["What will the temperature be tomorrow?"],
  outcomes: ["Lower", "Higher"],
  lowerBound: 20,
  upperBound: 100,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["LOWER", "HIGHER"],
};

export const multiScalarMarketParams = {
  marketName: "Test Multi-Scalar Market",
  encodedQuestions: [
    "What will the temperature be in New York?",
    "What will the temperature be in London?",
  ],
  outcomes: ["New York", "London"],
  lowerBound: 0,
  upperBound: 0,
  minBond: ethers.parseEther(MIN_BOND),
  openingTime: 0,
  tokenNames: ["NY_TEMP", "LON_TEMP"],
};
