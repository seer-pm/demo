import { getConfigNumber } from "@/lib/config";
import { CreateMarketProps, getCreateMarketParams } from "@/lib/create-market";
import { formatDate } from "@/lib/date";
import { MarketTypes } from "@/lib/market";
import { escapeJson } from "@/lib/reality";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { Address, TransactionReceipt } from "viem";
import { writeFutarchyFactoryCreateProposal, writeMarketFactory } from "./contracts/generated-market-factory";

const MarketTypeFunction: Record<
  string,
  "createCategoricalMarket" | "createScalarMarket" | "createMultiCategoricalMarket" | "createMultiScalarMarket"
> = {
  [MarketTypes.CATEGORICAL]: "createCategoricalMarket",
  [MarketTypes.SCALAR]: "createScalarMarket",
  [MarketTypes.MULTI_CATEGORICAL]: "createMultiCategoricalMarket",
  [MarketTypes.MULTI_SCALAR]: "createMultiScalarMarket",
} as const;

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeMarketFactory(config, {
        functionName: MarketTypeFunction[props.marketType],
        chainId: props.chainId,
        args: [getCreateMarketParams(props)],
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

export function getProposalName(marketName: string, openingTime: number, isArbitraryQuestion: boolean) {
  if (isArbitraryQuestion) {
    return marketName;
  }
  return `Will proposal "${marketName}" be accepted by ${formatDate(openingTime)} UTC?`;
}

async function createProposal(props: CreateMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeFutarchyFactoryCreateProposal(config, {
        args: [
          {
            marketName: escapeJson(getProposalName(props.marketName, props.openingTime, props.isArbitraryQuestion)),
            collateralToken1: props.collateralToken1 as Address,
            collateralToken2: props.collateralToken2 as Address,
            lang: "en_US",
            category: "misc",
            minBond: getConfigNumber("MIN_BOND", props.chainId),
            openingTime: props.openingTime,
          },
        ],
      }),
    {
      txSent: { title: "Creating proposal..." },
      txSuccess: { title: "Proposal created!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useCreateMarket = (isFutarchyMarket: boolean, onSuccess: (data: TransactionReceipt) => void) => {
  return useMutation({
    mutationFn: isFutarchyMarket ? createProposal : createMarket,
    onSuccess,
  });
};
