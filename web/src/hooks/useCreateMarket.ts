import { MarketFactoryAbi } from "@/abi/MarketFactoryAbi";
import { getConfigAddress, getConfigNumber } from "@/lib/config";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { TransactionReceipt } from "viem";

interface CreateMarketProps {
  marketName: string;
  encodedQuestion: string;
  outcomes: string[];
  templateId: number;
  openingTime: number;
  chainId?: number;
}

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const hash = await writeContract(config, {
    address: getConfigAddress("MARKET_FACTORY", props.chainId),
    abi: MarketFactoryAbi,
    functionName: "createMarket",
    args: [
      {
        marketName: props.marketName,
        encodedQuestion: props.encodedQuestion,
        outcomes: props.outcomes,
        minBond: getConfigNumber("MIN_BOND", props.chainId),
        templateId: BigInt(props.templateId),
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
