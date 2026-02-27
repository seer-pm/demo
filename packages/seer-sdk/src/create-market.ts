import { encodeFunctionData, zeroAddress } from "viem";
import type { AbiParameterToPrimitiveType, Address } from "viem";
import {
  futarchyFactoryAbi,
  futarchyFactoryAddress,
  marketFactoryAbi,
  marketFactoryAddress,
} from "../generated/generated-market-factory";
import type { Execution } from "./execution";
import { MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "./market";
import { escapeJson } from "./reality";

/** Props for creating a market. Only fields required for your market type are mandatory. */
export interface CreateMarketProps<TChainId extends number = number> {
  marketType: MarketTypes;
  marketName: string;
  outcomes: string[];
  openingTime: number;
  chainId: TChainId;
  /** Min bond for the chain (e.g. from config). Required for encoding. */
  minBond: bigint;
  /** Only for futarchy (createProposal). Default `""`. */
  collateralToken1?: Address | "";
  /** Only for futarchy (createProposal). Default `""`. */
  collateralToken2?: Address | "";
  /** Only for futarchy (createProposal). Default `true`. */
  isArbitraryQuestion?: boolean;
  /** Conditional market parent; use zero for root. Default zero address. */
  parentMarket?: Address;
  /** Conditional market parent outcome index. Default `0n`. */
  parentOutcome?: bigint;
  /** ERC20 names per outcome; derived from outcomes if omitted. Default `[]`. */
  tokenNames?: string[];
  /** Scalar only: min value in wei (1e18). Default `0n`. */
  lowerBound?: bigint;
  /** Scalar only: max value in wei (1e18). Default `0n`. */
  upperBound?: bigint;
  /** Scalar / multi scalar: unit (e.g. "°C"). Default `""`. */
  unit?: string;
  /** Reality.eth category (e.g. "politics", "weather"). Default `MISC_CATEGORY`. */
  category?: string;
}

/** Full props with all optional fields resolved (used internally). */
export type CreateMarketPropsFull<TChainId extends number = number> = Required<
  Omit<CreateMarketProps<TChainId>, "collateralToken1" | "collateralToken2">
> & {
  collateralToken1: Address | "";
  collateralToken2: Address | "";
};

const DEFAULT_KEYS = [
  "collateralToken1",
  "collateralToken2",
  "isArbitraryQuestion",
  "parentMarket",
  "parentOutcome",
  "tokenNames",
  "lowerBound",
  "upperBound",
  "unit",
  "category",
] as const;

const CREATE_MARKET_DEFAULTS: Pick<CreateMarketPropsFull<number>, (typeof DEFAULT_KEYS)[number]> = {
  collateralToken1: "",
  collateralToken2: "",
  isArbitraryQuestion: true,
  parentMarket: zeroAddress as Address,
  parentOutcome: 0n,
  tokenNames: [],
  lowerBound: 0n,
  upperBound: 0n,
  unit: "",
  category: "misc",
};

function withCreateMarketDefaults<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
): CreateMarketPropsFull<TChainId> {
  return {
    ...CREATE_MARKET_DEFAULTS,
    ...props,
    category: props.category ?? "misc",
  } as CreateMarketPropsFull<TChainId>;
}

export const MISC_CATEGORY = "misc";
export const WEATHER_CATEGORY = "weather";

export const MARKET_CATEGORIES: { value: string; text: string }[] = [
  { value: "elections", text: "Elections" },
  { value: "politics", text: "Politics" },
  { value: "business", text: "Business" },
  { value: "science", text: "Science" },
  { value: "crypto", text: "Crypto" },
  { value: "pop_culture", text: "Pop Culture" },
  { value: "sports", text: "Sports" },
  { value: "doge", text: "DOGE" },
  { value: MISC_CATEGORY, text: "Miscellaneous" },
  { value: WEATHER_CATEGORY, text: "Weather" },
];

export function generateTokenName(outcome: string): string {
  return outcome
    .replace(/[^\w\s]/gi, "")
    .replace(/[\u00A0\u2000-\u200F\u202F\u205F\u3000]/g, " ")
    .replaceAll("_", " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .replaceAll(" ", "_")
    .toLocaleUpperCase()
    .substring(0, 11);
}

function getTokenNames(tokenNames: string[], outcomes: string[]): string[] {
  return outcomes.map((outcome, i) =>
    ((tokenNames[i] || "").trim() !== "" ? tokenNames[i].trim() : generateTokenName(outcome)).slice(0, 31),
  );
}

/** Params struct for MarketFactory create* functions (same shape for all 4). */
type MarketFactoryAbi = typeof marketFactoryAbi;

type MarketFactoryCreateMarketParamsInputs = Extract<
  MarketFactoryAbi[number],
  { type: "function"; name: "createCategoricalMarket" }
>["inputs"][0]["components"];

/**
 * Exact TS representation of `struct MarketFactory.CreateMarketParams`,
 * derived directly from the ABI so it stays in sync with the contract.
 */
export type CreateMarketParams = {
  [C in MarketFactoryCreateMarketParamsInputs[number] as C["name"]]: AbiParameterToPrimitiveType<C>;
};

/** Returns the full CreateMarketParams struct with all fields filled (defaults applied to optional props). */
export function getCreateMarketParams<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
): CreateMarketParams {
  const p = withCreateMarketDefaults(props);
  const outcomes = getOutcomes(p.outcomes, p.marketType);
  const marketName = getMarketName(p.marketType, p.marketName, p.unit);
  const questionParts = getQuestionParts(marketName, p.marketType);

  return {
    marketName,
    questionStart: escapeJson(questionParts?.questionStart ?? ""),
    questionEnd: escapeJson(questionParts?.questionEnd ?? ""),
    outcomeType: escapeJson(questionParts?.outcomeType ?? ""),
    parentMarket: p.parentMarket,
    parentOutcome: p.parentOutcome,
    lang: "en_US",
    category: p.category || MISC_CATEGORY,
    outcomes: outcomes.map(escapeJson),
    tokenNames: getTokenNames(p.tokenNames, outcomes),
    lowerBound: p.lowerBound,
    upperBound: p.upperBound,
    minBond: p.minBond,
    openingTime: p.openingTime,
  };
}

const MARKET_TYPE_FUNCTION: Record<
  string,
  "createCategoricalMarket" | "createScalarMarket" | "createMultiCategoricalMarket" | "createMultiScalarMarket"
> = {
  [MarketTypes.CATEGORICAL]: "createCategoricalMarket",
  [MarketTypes.SCALAR]: "createScalarMarket",
  [MarketTypes.MULTI_CATEGORICAL]: "createMultiCategoricalMarket",
  [MarketTypes.MULTI_SCALAR]: "createMultiScalarMarket",
} as const;

const marketFactoryAddressMap = marketFactoryAddress as Record<number, Address>;
const futarchyFactoryAddressMap = futarchyFactoryAddress as Record<number, Address>;

export function getMarketFactoryAddress(chainId: number): Address {
  const address = marketFactoryAddressMap[chainId];
  if (!address) {
    throw new Error(`No market factory address for chain ${chainId}`);
  }
  return address as Address;
}

export function getFutarchyFactoryAddress(chainId: number): Address {
  const address = futarchyFactoryAddressMap[chainId];
  if (!address) {
    throw new Error(`No futarchy factory address for chain ${chainId}`);
  }
  return address as Address;
}

/**
 * Proposal name for futarchy markets (used in createProposal).
 */
export function getProposalName(marketName: string, openingTime: number, isArbitraryQuestion: boolean): string {
  if (isArbitraryQuestion) {
    return marketName;
  }
  const dateStr = new Date(openingTime * 1000).toUTCString();
  return `Will proposal "${marketName}" be accepted by ${dateStr}?`;
}

/**
 * Returns an Execution (to, value, data, chainId) for creating a market (MarketFactory).
 * Use this to send the tx (e.g. sendTransaction) or to add to a 7702 batch.
 *
 * @param props - CreateMarketProps (must include minBond for the chain)
 * @param marketFactoryAddress - Optional MarketFactory address; if omitted, uses the one for props.chainId
 */
export function getCreateMarketExecution<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
  marketFactoryAddress?: Address,
): Execution<TChainId> {
  const p = withCreateMarketDefaults(props);
  const factoryAddress = marketFactoryAddress ?? getMarketFactoryAddress(p.chainId);
  const params = getCreateMarketParams(props);
  const functionName = MARKET_TYPE_FUNCTION[p.marketType];
  const fnAbi = (marketFactoryAbi as readonly { type: string; name?: string }[]).find(
    (f) => f.type === "function" && f.name === functionName,
  );
  if (!fnAbi) {
    throw new Error(`Unknown market type: ${props.marketType}`);
  }

  const data = encodeFunctionData({
    abi: marketFactoryAbi,
    functionName,
    args: [
      {
        marketName: params.marketName,
        outcomes: params.outcomes,
        questionStart: params.questionStart,
        questionEnd: params.questionEnd,
        outcomeType: params.outcomeType,
        parentOutcome: params.parentOutcome,
        parentMarket: params.parentMarket,
        category: params.category,
        lang: params.lang,
        lowerBound: params.lowerBound,
        upperBound: params.upperBound,
        minBond: params.minBond,
        openingTime: params.openingTime,
        tokenNames: params.tokenNames,
      },
    ],
  });

  return {
    to: factoryAddress,
    value: 0n,
    data,
    chainId: p.chainId,
  };
}

/**
 * Returns an Execution (to, value, data, chainId) for creating a futarchy proposal (FutarchyFactory).
 * Use this to send the tx (e.g. sendTransaction) or to add to a 7702 batch.
 *
 * @param props - CreateMarketProps (must include minBond for the chain)
 * @param futarchyFactoryAddress - Optional FutarchyFactory address; if omitted, uses the one for props.chainId
 */
export function getCreateProposalExecution<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
  futarchyFactoryAddress?: Address,
): Execution<TChainId> {
  const p = withCreateMarketDefaults(props);
  const factoryAddress = futarchyFactoryAddress ?? getFutarchyFactoryAddress(p.chainId);
  const proposalName = escapeJson(getProposalName(p.marketName, p.openingTime, p.isArbitraryQuestion));
  const data = encodeFunctionData({
    abi: futarchyFactoryAbi,
    functionName: "createProposal",
    args: [
      {
        marketName: proposalName,
        collateralToken1: p.collateralToken1 as Address,
        collateralToken2: p.collateralToken2 as Address,
        category: "misc",
        lang: "en_US",
        minBond: p.minBond,
        openingTime: p.openingTime,
      },
    ],
  });

  return {
    to: factoryAddress,
    value: 0n,
    data,
    chainId: p.chainId,
  };
}
