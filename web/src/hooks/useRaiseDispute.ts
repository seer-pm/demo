import { SupportedChain, gnosis, mainnet, sepolia } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import {
  writeRealitioForeignArbitrationProxyWithAppealsRequestArbitration,
  writeRealitioForeignProxyOptimismRequestArbitration,
  writeRealitioV2_1ArbitratorWithAppealsRequestArbitration,
} from "./contracts/generated-arbitrators";

interface RaiseDisputeProps {
  questionId: `0x${string}`;
  currentBond: bigint;
  arbitrationCost: bigint;
  chainId: SupportedChain;
}

async function raiseDispute(props: RaiseDisputeProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    async () => {
      return props.chainId === mainnet.id || props.chainId === sepolia.id
        ? writeRealitioV2_1ArbitratorWithAppealsRequestArbitration(config, {
            args: [props.questionId, props.currentBond],
            value: props.arbitrationCost,
            chainId: props.chainId,
          })
        : props.chainId === gnosis.id
          ? writeRealitioForeignArbitrationProxyWithAppealsRequestArbitration(config, {
              args: [props.questionId, props.currentBond],
              value: props.arbitrationCost,
              chainId: mainnet.id,
            })
          : writeRealitioForeignProxyOptimismRequestArbitration(config, {
              args: [props.questionId, props.currentBond],
              value: props.arbitrationCost,
              chainId: mainnet.id,
            });
    },
    {
      txSent: { title: "Creating dispute..." },
      txSuccess: { title: "Dispute created!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useRaiseDispute = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: raiseDispute,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
      onSuccess(data);
    },
  });
};
