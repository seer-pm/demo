import { Market } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { getResolveMarketExecution } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { TransactionReceipt } from "viem";

interface ResolveMarketProps {
  market: Market;
}

async function resolveMarket(props: ResolveMarketProps): Promise<TransactionReceipt> {
  const execution = getResolveMarketExecution(props.market.id, props.market.chainId);

  const result = await toastifyTx(() => sendTransaction(config, execution), {
    txSent: { title: "Resolving market..." },
    txSuccess: { title: "Market resolved!" },
  });

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
