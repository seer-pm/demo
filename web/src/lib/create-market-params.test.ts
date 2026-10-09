import {
  DEFAULT_COLLATERAL_PROFILE,
  DEFAULT_QUESTION_TIMEOUT,
  MAX_QUESTION_TIMEOUT,
  MarketTypes,
  TOKENS_BY_CHAIN,
  decodeQuestion,
  encodeQuestionText,
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

  it.skipIf(hasNewFactory)("refuses a description on a V1 factory, whose Reality has no description", () => {
    expect(() => getCreateMarketExecution(baseProps({ description: "Per the official forecast." }))).toThrow(
      /per-market params/,
    );
    const decoded = decodeFunctionData({ abi: marketFactoryV1Abi, data: getCreateMarketExecution(baseProps()).data });
    const [params] = decoded.args as unknown as [Record<string, unknown>];
    expect(params.category).toBe("misc");
  });

  it.skipIf(!hasNewFactory)("encodes the description for the new factory", () => {
    const execution = getCreateMarketExecution(baseProps({ description: 'Counts "rain" over 1mm.' }));
    const decoded = decodeFunctionData({ abi: marketFactoryAbi, data: execution.data });
    const [params] = decoded.args as unknown as [Record<string, unknown>];
    expect(params.description).toBe('Counts \\"rain\\" over 1mm.');
  });

  it.skipIf(!hasNewFactory)("encodes the collateral and timeout for the new factory", () => {
    const execution = getCreateMarketExecution(baseProps({ collateralToken: GNOSIS_XDAI, questionTimeout: 3600 }));
    const decoded = decodeFunctionData({ abi: marketFactoryAbi, data: execution.data });
    const [params] = decoded.args as unknown as [Record<string, unknown>];
    expect(params.collateralToken).toBe(GNOSIS_XDAI);
    expect(params.questionTimeout).toBe(3600);
  });
});

describe("Reality question description", () => {
  it("escapes the description into the question text and decodes it back", () => {
    const description = 'Line one with "quotes".\nLine two \\ backslash.';
    const encoded = encodeQuestionText("single-select", "Will it rain?", ["Yes", "No"], description, "en_US");
    // Reality pastes the field into the template's JSON, so the result must parse
    const [title, outcomes, field, lang] = encoded.split("\u241f");
    expect(() =>
      JSON.parse(`{"title": "${title}", "outcomes": [${outcomes}], "description": "${field}", "lang": "${lang}"}`),
    ).not.toThrow();
    expect(decodeQuestion(encoded).description).toBe(description);
  });

  it("drops the field delimiter so the description cannot split the question", () => {
    const encoded = encodeQuestionText("uint", "How much?", [], "a\u241fb", "en_US");
    expect(encoded.split("\u241f")).toHaveLength(3);
    expect(decodeQuestion(encoded).description).toBe("ab");
  });
});
