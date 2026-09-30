import {
  DEFAULT_COLLATERAL_PROFILE,
  DEFAULT_QUESTION_TIMEOUT,
  MAX_QUESTION_TIMEOUT,
  MarketTypes,
  TOKENS_BY_CHAIN,
  getActivePrimaryCollateral,
  getCreateMarketExecution,
  getCreateMarketParams,
  getCreateMarketTarget,
  validateNewMarket,
} from "@seer-pm/sdk";
import type { CreateMarketProps } from "@seer-pm/sdk";
import { decodeFunctionData, parseEther } from "viem";
import { gnosis } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  marketFactoryAbi,
  marketFactoryAddress,
  marketFactoryV1Abi,
} from "../../../packages/seer-pm-sdk/generated/contracts/market-factory";

const GNOSIS_SDAI = TOKENS_BY_CHAIN[gnosis.id].sDAI;
const GNOSIS_XDAI = TOKENS_BY_CHAIN[gnosis.id].xDAI;

const baseProps = (overrides: Partial<CreateMarketProps> = {}): CreateMarketProps => ({
  marketType: MarketTypes.CATEGORICAL,
  marketName: "Will it rain tomorrow?",
  outcomes: ["Yes", "No"],
  openingTime: 1_800_000_000,
  chainId: gnosis.id,
  minBond: parseEther("10"),
  ...overrides,
});

describe("getCreateMarketParams collateral and timeout", () => {
  it("defaults to the active primary collateral and a 3.5 day timeout", () => {
    const params = getCreateMarketParams(baseProps());
    expect(params.collateralToken).toBe(getActivePrimaryCollateral(gnosis.id).address);
    expect(params.questionTimeout).toBe(DEFAULT_QUESTION_TIMEOUT);
    expect(DEFAULT_QUESTION_TIMEOUT).toBe(302400);
  });

  it("keeps an explicit collateral and timeout", () => {
    const params = getCreateMarketParams(baseProps({ collateralToken: GNOSIS_XDAI, questionTimeout: 3600 }));
    expect(params.collateralToken).toBe(GNOSIS_XDAI);
    expect(params.questionTimeout).toBe(3600);
  });
});

describe("validateNewMarket collateral and timeout", () => {
  const paths = (props: CreateMarketProps) => validateNewMarket(props).map((issue) => issue.path);

  it("accepts the defaults", () => {
    expect(paths(baseProps())).not.toContain("questionTimeout");
    expect(paths(baseProps())).not.toContain("collateralToken");
  });

  it("rejects a timeout of zero, of 365 days and a fractional one", () => {
    expect(paths(baseProps({ questionTimeout: 0 }))).toContain("questionTimeout");
    expect(paths(baseProps({ questionTimeout: 365 * 24 * 60 * 60 }))).toContain("questionTimeout");
    expect(paths(baseProps({ questionTimeout: 1.5 }))).toContain("questionTimeout");
    expect(paths(baseProps({ questionTimeout: MAX_QUESTION_TIMEOUT }))).not.toContain("questionTimeout");
    expect(paths(baseProps({ questionTimeout: 1 }))).not.toContain("questionTimeout");
  });

  it("rejects a collateral that is not an address", () => {
    expect(paths(baseProps({ collateralToken: "0x123" as `0x${string}` }))).toContain("collateralToken");
  });
});

describe("getCreateMarketExecution factory target", () => {
  const hasNewFactory = gnosis.id in marketFactoryAddress;

  it("targets the V1 factory until the new one is deployed on the chain", () => {
    const target = getCreateMarketTarget(gnosis.id, DEFAULT_COLLATERAL_PROFILE);
    expect(target.v1).toBe(!hasNewFactory);
  });

  it.skipIf(hasNewFactory)("encodes the 14-field struct for a V1 factory", () => {
    const execution = getCreateMarketExecution(baseProps());
    const decoded = decodeFunctionData({ abi: marketFactoryV1Abi, data: execution.data });
    expect(decoded.functionName).toBe("createCategoricalMarket");
    const [params] = decoded.args as unknown as [Record<string, unknown>];
    expect(Object.keys(params)).toHaveLength(14);
    expect(params).not.toHaveProperty("collateralToken");
    expect(params.minBond).toBe(parseEther("10"));
  });

  it.skipIf(hasNewFactory)("refuses a custom collateral or timeout on a V1 factory", () => {
    expect(() => getCreateMarketExecution(baseProps({ questionTimeout: 3600 }))).toThrow(/per-market params/);
    expect(() => getCreateMarketExecution(baseProps({ collateralToken: GNOSIS_XDAI }))).toThrow(/per-market params/);
    expect(() => getCreateMarketExecution(baseProps({ collateralToken: GNOSIS_SDAI }))).not.toThrow();
  });

  it.skipIf(!hasNewFactory)("encodes the collateral and timeout for the new factory", () => {
    const execution = getCreateMarketExecution(baseProps({ collateralToken: GNOSIS_XDAI, questionTimeout: 3600 }));
    const decoded = decodeFunctionData({ abi: marketFactoryAbi, data: execution.data });
    const [params] = decoded.args as unknown as [Record<string, unknown>];
    expect(params.collateralToken).toBe(GNOSIS_XDAI);
    expect(params.questionTimeout).toBe(3600);
  });
});
