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
}

interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  outcomes: string[];
  lowerBound: number;
  upperBound: number;
  unit: string;
  category: string;
  openingTime: number;
  chainId?: number;
}

function getEncodedQuestion(props: CreateMarketProps) {
  if (props.marketType === MarketTypes.CATEGORICAL) {
    return encodeQuestionText("single-select", props.marketName, props.outcomes, props.category, "en_US");
  }

  return encodeQuestionText("uint", `${props.marketName} [${props.unit}]`, null, props.category, "en_US");
}

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const encodedQuestion = getEncodedQuestion(props);

  const hash = await writeContract(config, {
    address: getConfigAddress("MARKET_FACTORY", props.chainId),
    abi: MarketFactoryAbi,
    functionName: props.marketType === MarketTypes.CATEGORICAL ? "createCategoricalMarket" : "createScalarMarket",
    args: [
      {
        marketName: props.marketName,
        encodedQuestion: encodedQuestion,
        outcomes: props.outcomes,
        lowerBound: BigInt(props.lowerBound),
        upperBound: BigInt(props.upperBound),
        minBond: getConfigNumber("MIN_BOND", props.chainId),
        openingTime: props.openingTime,
      },
    ],
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    confirmations: 2,
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
