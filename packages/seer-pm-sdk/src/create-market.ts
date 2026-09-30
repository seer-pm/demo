import { encodeFunctionData, isAddressEqual, zeroAddress } from "viem";
import type { AbiParameterToPrimitiveType, Address } from "viem";
import {
  circlesMarketFactoryAddress,
  futarchyFactoryAbi,
  futarchyFactoryAddress,
  marketFactoryAbi,
  marketFactoryAddress,
  marketFactoryV1Abi,
  marketFactoryV1Address,
} from "../generated/contracts/market-factory";
import { DEFAULT_COLLATERAL_PROFILE, getActiveCollateralProfileName, getActivePrimaryCollateral } from "./collateral";
import type { Execution } from "./execution";
import { MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "./market";
import { escapeJson } from "./reality";

/** Reality question timeout a market gets unless one is given: 3.5 days. */
export const DEFAULT_QUESTION_TIMEOUT = 60 * 60 * 24 * 3.5;
/** Reality rejects a question timeout of 365 days or more. */
export const MAX_QUESTION_TIMEOUT = 365 * 24 * 60 * 60 - 1;

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
  /**
   * Base collateral of the outcome tokens. Default: the active profile's primary collateral.
   * A conditional market must use the collateral of its parent market, or the factory reverts.
   */
  collateralToken?: Address;
  /** Reality question timeout in seconds. Default `DEFAULT_QUESTION_TIMEOUT`. */
  questionTimeout?: number;
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
  "questionTimeout",
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
  questionTimeout: DEFAULT_QUESTION_TIMEOUT,
};

function withCreateMarketDefaults<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
): CreateMarketPropsFull<TChainId> {
  return {
    ...CREATE_MARKET_DEFAULTS,
    ...props,
    category: props.category ?? "misc",
    // chain-dependent, so it cannot sit in the static defaults
    collateralToken: props.collateralToken ?? getActivePrimaryCollateral(props.chainId).address,
    questionTimeout: props.questionTimeout ?? DEFAULT_QUESTION_TIMEOUT,
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
    collateralToken: p.collateralToken,
    questionTimeout: p.questionTimeout,
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

/** MarketFactory deployments per chain (from generated contract addresses). */
const marketFactoryAddressMap = marketFactoryAddress as Record<number, Address>;
/** V1 factories have a fixed collateral and timeout; they keep serving the markets they created. */
const marketFactoryV1AddressMap = marketFactoryV1Address as Record<number, Address>;
const futarchyFactoryAddressMap = futarchyFactoryAddress as Record<number, Address>;
const circlesMarketFactoryAddressMap = circlesMarketFactoryAddress as Record<number, Address>;

export const MARKET_FACTORY_KEY = "marketFactory" as const;
export const MARKET_FACTORY_V1_KEY = "marketFactoryV1" as const;
export const FUTARCHY_FACTORY_KEY = "futarchyFactory" as const;
export const CIRCLES_FACTORY_KEY = "circlesFactory" as const;

export type FactoryKey =
  | typeof MARKET_FACTORY_KEY
  | typeof MARKET_FACTORY_V1_KEY
  | typeof FUTARCHY_FACTORY_KEY
  | typeof CIRCLES_FACTORY_KEY
  | (string & {});

const MARKET_FACTORY_BY_PROFILE: Record<string, Record<string, Record<number, Address>>> = {
  [DEFAULT_COLLATERAL_PROFILE]: {
    [MARKET_FACTORY_KEY]: marketFactoryAddressMap,
    [MARKET_FACTORY_V1_KEY]: marketFactoryV1AddressMap,
    [FUTARCHY_FACTORY_KEY]: futarchyFactoryAddressMap,
    [CIRCLES_FACTORY_KEY]: circlesMarketFactoryAddressMap,
  },
  circles: {
    [MARKET_FACTORY_KEY]: circlesMarketFactoryAddressMap,
  },
};

function getFactoryAddress(chainId: number, collateralProfile: string, factoryKey: string): Address {
  const profileFactories = MARKET_FACTORY_BY_PROFILE[collateralProfile];
  if (!profileFactories) {
    throw new Error(`No factories for collateral profile "${collateralProfile}" on chain ${chainId}`);
  }
  const map = profileFactories[factoryKey];
  if (!map) {
    throw new Error(`No factory "${factoryKey}" for collateral profile "${collateralProfile}" on chain ${chainId}`);
  }
  const address = map[chainId];
  if (!address) {
    throw new Error(
      `No address for factory "${factoryKey}" (collateralProfile ${collateralProfile}) on chain ${chainId}`,
    );
  }
  return address as Address;
}

export type CreateMarketTarget = {
  address: Address;
  /** The factory takes the V1 params struct (fixed collateral and timeout), so no custom collateral or timeout. */
  v1: boolean;
};

/**
 * The factory a new market goes to. The default profile creates on the chain's MarketFactory where it is
 * deployed and on the V1 one elsewhere. The circles profile keeps its own factory: listings filter
 * markets by factory address, so a factory shared with the default profile would mix both collaterals.
 */
export function getCreateMarketTarget(chainId: number, collateralProfile: string): CreateMarketTarget {
  if (collateralProfile === DEFAULT_COLLATERAL_PROFILE) {
    const address = marketFactoryAddressMap[chainId];
    if (address) {
      return { address, v1: false };
    }
    return { address: getFactoryAddress(chainId, collateralProfile, MARKET_FACTORY_V1_KEY), v1: true };
  }
  return { address: getFactoryAddress(chainId, collateralProfile, MARKET_FACTORY_KEY), v1: true };
}

export function getMarketFactoryAddress(chainId: number, collateralProfile: string): Address {
  return getCreateMarketTarget(chainId, collateralProfile).address;
}

function isV1Factory(chainId: number, factoryAddress: Address): boolean {
  return [marketFactoryV1AddressMap[chainId], circlesMarketFactoryAddressMap[chainId]].some(
    (address) => address && isAddressEqual(address, factoryAddress),
  );
}

/** Returns every factory address for a collateral profile (all factory keys, all chains). */
export function getAllFactoryAddressesForProfile(collateralProfile: string): Address[] {
  const factories = MARKET_FACTORY_BY_PROFILE[collateralProfile];
  if (!factories) {
    throw new Error(`No factories for collateral profile "${collateralProfile}"`);
  }
  const addresses = Object.values(factories).flatMap((map) =>
    Object.values(map).map((address) => address.toLowerCase() as Address),
  );
  if (!addresses.length) {
    throw new Error(`No factory addresses for collateral profile "${collateralProfile}"`);
  }
  return [...new Set(addresses)];
}

/** Whether `factoryAddress` is a known official Seer factory (any collateral profile). */
export function isOfficialMarketFactory(factoryAddress: Address | undefined, _chainId: number): boolean {
  if (!factoryAddress) {
    return false;
  }
  return Object.keys(MARKET_FACTORY_BY_PROFILE).some((profile) => {
    try {
      return getAllFactoryAddressesForProfile(profile).some((address) => isAddressEqual(factoryAddress, address));
    } catch {
      return false;
    }
  });
}

export function getFutarchyFactoryAddress(chainId: number): Address {
  return getFactoryAddress(chainId, DEFAULT_COLLATERAL_PROFILE, FUTARCHY_FACTORY_KEY);
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
 * @param marketFactoryAddress - Optional MarketFactory address; if omitted, uses the factory for the active collateral profile
 * @throws when the target is a V1 factory and the props ask for a custom collateral or question timeout
 */
export function getCreateMarketExecution<TChainId extends number = number>(
  props: CreateMarketProps<TChainId>,
  marketFactoryAddress?: Address,
): Execution<TChainId> {
  const p = withCreateMarketDefaults(props);
  const target: CreateMarketTarget = marketFactoryAddress
    ? { address: marketFactoryAddress, v1: isV1Factory(p.chainId, marketFactoryAddress) }
    : getCreateMarketTarget(p.chainId, getActiveCollateralProfileName());
  const params = getCreateMarketParams(props);
  const functionName = MARKET_TYPE_FUNCTION[p.marketType];
  if (!functionName) {
    throw new Error(`Unknown market type: ${props.marketType}`);
  }

  let data: `0x${string}`;
  if (target.v1) {
    const primary = getActivePrimaryCollateral(p.chainId).address;
    if (!isAddressEqual(params.collateralToken, primary) || params.questionTimeout !== DEFAULT_QUESTION_TIMEOUT) {
      throw new Error(
        `A custom collateral or question timeout needs the MarketFactory with per-market params, which chain ${p.chainId} does not have yet`,
      );
    }
    const { collateralToken: _collateralToken, questionTimeout: _questionTimeout, ...v1Params } = params;
    data = encodeFunctionData({ abi: marketFactoryV1Abi, functionName, args: [v1Params] });
  } else {
    data = encodeFunctionData({ abi: marketFactoryAbi, functionName, args: [params] });
  }

  return {
    to: target.address,
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
