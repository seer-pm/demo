import { MarketFactoryAbi } from "@/abi/MarketFactoryAbi";
import { getConfigAddress, getConfigNumber } from "@/lib/config";
import { encodeQuestionText } from "@/lib/reality";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { TransactionReceipt } from "viem";

export enum MarketTypes {
  CATEGORICAL = 1,
  SCALAR = 2,
  MULTI_SCALAR = 3,
}

interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  outcomes: string[];
  outcomesQuestion: string;
  lowerBound: number;
  upperBound: number;
  unit: string;
  category: string;
  openingTime: number;
  chainId?: number;
}

export const OUTCOME_PLACEHOLDER = "[PLACEHOLDER]";

const MarketTypeFunction: Record<string, "createCategoricalMarket" | "createScalarMarket" | "createMultiScalarMarket"> =
  {
    [MarketTypes.CATEGORICAL]: "createCategoricalMarket",
    [MarketTypes.SCALAR]: "createScalarMarket",
    [MarketTypes.MULTI_SCALAR]: "createMultiScalarMarket",
  } as const;

function getEncodedQuestions(props: CreateMarketProps): string[] {
  if (props.marketType === MarketTypes.CATEGORICAL) {
    return [encodeQuestionText("single-select", props.marketName, props.outcomes, props.category, "en_US")];
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

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const hash = await writeContract(config, {
    address: getConfigAddress("MarketFactory", props.chainId),
    abi: MarketFactoryAbi,
    functionName: MarketTypeFunction[props.marketType],
    args: [
      {
        marketName: props.marketName,
        encodedQuestions: getEncodedQuestions(props),
        outcomes: props.outcomes,
        lowerBound: BigInt(props.lowerBound),
        upperBound: BigInt(props.upperBound),
        minBond: getConfigNumber("MIN_BOND", props.chainId),
        openingTime: props.openingTime,
      },
    ],
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useCreateMarket = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: createMarket,
    onSuccess,
  });
};
