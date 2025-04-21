import { describe } from "vitest";
import { MarketTypes, getQuestionParts } from "./market";

describe("getQuestionParts", () => {
  it("should return empty strings for non-multi-scalar market types", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election?";

    expect(getQuestionParts(marketName, MarketTypes.CATEGORICAL)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
    expect(getQuestionParts(marketName, MarketTypes.SCALAR)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
    expect(getQuestionParts(marketName, MarketTypes.MULTI_CATEGORICAL)).toEqual({
      questionStart: "",
      questionEnd: "",
      outcomeType: "",
    });
  });

  it("should return correct parts for a valid multi-scalar market name", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);

    expect(result).toEqual({
      questionStart: "How many electoral votes will the ",
      questionEnd: " win in the 2024 U.S. Presidential Election?",
      outcomeType: "party",
    });
  });

  it("should return correct parts for a valid multi-scalar market name with unit", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? [votes]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);

    expect(result).toEqual({
      questionStart: "How many electoral votes will the ",
      questionEnd: " win in the 2024 U.S. Presidential Election? [votes]",
      outcomeType: "party",
    });
  });

  it("should return undefined when multi-scalar market name doesn't have the correct format", () => {
    const marketName = "How many electoral votes will the party win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has multiple brackets", () => {
    const marketName = "How many electoral votes will the [party] win in the [2024] U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has brackets in wrong order", () => {
    const marketName = "How many electoral votes will the ]party[ win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty outcomeType", () => {
    const marketName = "How many electoral votes will the [] win in the 2024 U.S. Presidential Election?";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty questionEnd", () => {
    const marketName = "How many electoral votes will the [party]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has unit brackets in wrong position", () => {
    const marketName =
      "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? [votes] [extra]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has empty unit", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election? []";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });

  it("should return undefined when multi-scalar market name has unit without question mark", () => {
    const marketName = "How many electoral votes will the [party] win in the 2024 U.S. Presidential Election [votes]";
    const result = getQuestionParts(marketName, MarketTypes.MULTI_SCALAR);
    expect(result).toBeUndefined();
  });
});
