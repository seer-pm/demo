import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";
import { marketAbi } from "./contracts/generated-market-factory";

interface ResolveMarketProps {
  marketId: Address;
}

async function resolveMarket(props: ResolveMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.marketId,
        abi: marketAbi,
        functionName: "resolve",
      }),
    {
      txSent: { title: "Resolving market..." },
      txSuccess: { title: "Market resolved!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useResolveMarket = () => {
  return useMutation({
    mutationFn: resolveMarket,
    onSuccess: (/*data: TransactionReceipt*/) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
    },
  });
};
