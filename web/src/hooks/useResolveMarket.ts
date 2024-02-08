import { MarketAbi } from "@/abi/MarketAbi";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";

interface ResolveMarketProps {
  marketId: Address;
}

async function resolveMarket(props: ResolveMarketProps): Promise<TransactionReceipt> {
  const hash = await writeContract(config, {
    address: props.marketId,
    abi: MarketAbi,
    functionName: "resolve",
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    confirmations: 0,
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export const useResolveMarket = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: resolveMarket,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
      onSuccess(data);
    },
  });
};
