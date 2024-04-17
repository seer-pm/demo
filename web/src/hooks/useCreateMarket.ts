import { getConfigNumber } from "@/lib/config";
import { MarketTypes } from "@/lib/market";
import { encodeQuestionText } from "@/lib/reality";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { writeMarketFactory } from "./contracts/generated";

interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  outcomes: string[];
  tokenNames: string[];
  outcomesQuestion: string;
  lowerBound: number;
  upperBound: number;
  unit: string;
  category: string;
  openingTime: number;
  chainId?: number;
}

export const OUTCOME_PLACEHOLDER = "[PLACEHOLDER]";

const MarketTypeFunction: Record<
  string,
  "createCategoricalMarket" | "createScalarMarket" | "createMultiCategoricalMarket" | "createMultiScalarMarket"
> = {
  [MarketTypes.CATEGORICAL]: "createCategoricalMarket",
  [MarketTypes.SCALAR]: "createScalarMarket",
  [MarketTypes.MULTI_CATEGORICAL]: "createMultiCategoricalMarket",
  [MarketTypes.MULTI_SCALAR]: "createMultiScalarMarket",
} as const;

function getEncodedQuestions(props: CreateMarketProps): string[] {
  if (props.marketType === MarketTypes.CATEGORICAL) {
    return [encodeQuestionText("single-select", props.marketName, props.outcomes, props.category, "en_US")];
  }

  if (props.marketType === MarketTypes.MULTI_CATEGORICAL) {
    return [encodeQuestionText("multiple-select", props.marketName, props.outcomes, props.category, "en_US")];
  }

  if (props.marketType === MarketTypes.MULTI_SCALAR) {
    return props.outcomes.map((outcome) => {
      return encodeQuestionText(
        "uint",
        props.outcomesQuestion.replace(OUTCOME_PLACEHOLDER, outcome),
        null,
        props.category,
        "en_US",
      );
    });
  }

  // MarketTypes.SCALAR
  return [encodeQuestionText("uint", `${props.marketName} [${props.unit}]`, null, props.category, "en_US")];
}

export function getOutcomes(
  outcomes: string[],
  lowerBound: number,
  upperBound: number,
  unit: string,
  marketType: MarketTypes,
) {
  if (marketType === MarketTypes.SCALAR) {
    return [`Lower than ${lowerBound} ${unit}`, `Higher than ${upperBound} ${unit}`];
  }

  return outcomes;
}

function getTokenNames(tokenNames: string[], outcomes: string[]) {
  // we loop over `outcomes` because it's the return valut of getOutcomes(),
  // that already has the correct outcomes for scalar markets
  return outcomes.map((outcome, i) =>
    tokenNames[i].trim() !== "" ? tokenNames[i].trim() : outcome.toLocaleUpperCase().replaceAll(" ", "_"),
  );
}

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const outcomes = getOutcomes(props.outcomes, props.lowerBound, props.upperBound, props.unit, props.marketType);

  const result = await toastifyTx(
    () =>
      writeMarketFactory(config, {
        functionName: MarketTypeFunction[props.marketType],
        args: [
          {
            marketName: props.marketName,
            encodedQuestions: getEncodedQuestions(props),
            outcomes,
            tokenNames: getTokenNames(props.tokenNames, outcomes),
            lowerBound: BigInt(props.lowerBound),
            upperBound: BigInt(props.upperBound),
            minBond: getConfigNumber("MIN_BOND", props.chainId),
            openingTime: props.openingTime,
          },
        ],
      }),
    {
      txSent: { title: "Creating market..." },
      txSuccess: { title: "Market created!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useCreateMarket = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: createMarket,
    onSuccess,
  });
};
