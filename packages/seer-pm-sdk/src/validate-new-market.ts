import { isAddress } from "viem";
import type { CreateMarketProps } from "./create-market";
import { generateTokenName } from "./create-market";
import { INVALID_RESULT_OUTCOME_TEXT, MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "./market";

export interface NewMarketValidationIssue {
  path: string;
  message: string;
}

function isSameString(a: string | undefined | null, b: string | undefined | null): boolean {
  return !!a?.trim() && a.trim().toLowerCase() === b?.trim().toLowerCase();
}

function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim() === "";
}

function pushIssue(issues: NewMarketValidationIssue[], path: string, message: string) {
  issues.push({ path, message });
}

export function validateNewMarket(props: CreateMarketProps): NewMarketValidationIssue[] {
  const issues: NewMarketValidationIssue[] = [];

  const validMarketTypes = new Set(Object.values(MarketTypes));
  if (!validMarketTypes.has(props.marketType)) {
    pushIssue(issues, "marketType", "Invalid market type.");
    return issues;
  }

  if (isEmpty(props.marketName)) {
    pushIssue(issues, "marketName", "This field is required.");
  }

  const needsOutcomes =
    props.marketType === MarketTypes.CATEGORICAL ||
    props.marketType === MarketTypes.MULTI_CATEGORICAL ||
    props.marketType === MarketTypes.MULTI_SCALAR;

  if (needsOutcomes) {
    if (props.outcomes.length < 2) {
      pushIssue(issues, "outcomes", "At least 2 outcomes are required.");
    }

    props.outcomes.forEach((outcome, index) => {
      if (isEmpty(outcome)) {
        pushIssue(issues, `outcomes.${index}`, "This field is required.");
        return;
      }

      if (isSameString(outcome, INVALID_RESULT_OUTCOME_TEXT)) {
        pushIssue(issues, `outcomes.${index}`, "Invalid Outcome.");
      }

      const duplicatedOutcome = props.outcomes.some((otherOutcome, otherIndex) => {
        if (otherIndex === index) return false;
        return isSameString(outcome, otherOutcome);
      });
      if (duplicatedOutcome) {
        pushIssue(issues, `outcomes.${index}`, "Duplicated outcome.");
      }
    });

    const normalizedOutcomes = getOutcomes(props.outcomes, props.marketType);
    const tokenNames = props.tokenNames ?? [];

    normalizedOutcomes.forEach((outcome, index) => {
      const tokenName = (tokenNames[index] || "").trim();
      if (tokenName && isSameString(tokenName, INVALID_RESULT_OUTCOME_TEXT)) {
        pushIssue(issues, `tokenNames.${index}`, "Invalid Token Name.");
      }
      if (tokenName && tokenName.length > 11) {
        pushIssue(issues, `tokenNames.${index}`, "Maximum 11 characters.");
      }

      const currentTokenName = tokenName || generateTokenName(outcome);
      if (!currentTokenName) return;

      const duplicatedTokenName = normalizedOutcomes.some((otherOutcome, otherIndex) => {
        if (otherIndex === index) return false;
        const otherTokenName = (tokenNames[otherIndex] || "").trim() || generateTokenName(otherOutcome);
        return isSameString(currentTokenName, otherTokenName);
      });

      if (duplicatedTokenName) {
        pushIssue(issues, `tokenNames.${index}`, "Duplicated token name.");
      }
    });
  }

  if (props.marketType === MarketTypes.SCALAR) {
    if (typeof props.lowerBound === "undefined") {
      pushIssue(issues, "lowerBound", "This field is required.");
    } else if (props.lowerBound < 0n) {
      pushIssue(issues, "lowerBound", "Value cannot be negative.");
    }

    if (typeof props.upperBound === "undefined") {
      pushIssue(issues, "upperBound", "This field is required.");
    } else if (typeof props.lowerBound !== "undefined" && props.upperBound <= props.lowerBound) {
      pushIssue(issues, "upperBound", "Upper bound must be greater than lower bound.");
    }
  }

  if (props.marketType === MarketTypes.MULTI_SCALAR) {
    if (typeof props.upperBound === "undefined") {
      pushIssue(issues, "upperBound", "This field is required.");
    } else if (props.upperBound < 0n) {
      pushIssue(issues, "upperBound", "Value must be greater than 0.");
    }
  }

  if (props.marketType === MarketTypes.MULTI_SCALAR) {
    const marketName = getMarketName(props.marketType, props.marketName, props.unit ?? "");
    if (!getQuestionParts(marketName, props.marketType)) {
      pushIssue(
        issues,
        "marketName",
        "Invalid question format. The question must include one [outcome type] at the beginning or within the question body.",
      );
    }
  }

  if (typeof props.parentOutcome !== "undefined" && props.parentOutcome < 0n) {
    pushIssue(issues, "parentOutcome", "Parent outcome must be greater than or equal to 0.");
  }

  if (typeof props.parentMarket !== "undefined" && !isAddress(props.parentMarket)) {
    pushIssue(issues, "parentMarket", "Invalid address.");
  }

  const collateralToken1 = (props.collateralToken1 ?? "").trim();
  const collateralToken2 = (props.collateralToken2 ?? "").trim();
  const hasAnyCollateral = collateralToken1 !== "" || collateralToken2 !== "";

  if (hasAnyCollateral) {
    if (!collateralToken1) {
      pushIssue(issues, "collateralToken1", "This field is required.");
    } else if (!isAddress(collateralToken1)) {
      pushIssue(issues, "collateralToken1", "Invalid address.");
    }

    if (!collateralToken2) {
      pushIssue(issues, "collateralToken2", "This field is required.");
    } else if (!isAddress(collateralToken2)) {
      pushIssue(issues, "collateralToken2", "Invalid address.");
    }

    if (collateralToken1 && collateralToken2 && isSameString(collateralToken1, collateralToken2)) {
      pushIssue(issues, "collateralToken2", "Duplicated collateral.");
    }
  }

  return issues;
}
