import { SupportedChain, mainnet } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
  readRealitioV2_1ArbitratorWithAppealsArbitrationRequests,
} from "./contracts/generated";

async function getArbitrationDisputeId(questionId: `0x${string}`, chainId: SupportedChain): Promise<number> {
  if (chainId === mainnet.id) {
    const arbitrationRequest = await readRealitioV2_1ArbitratorWithAppealsArbitrationRequests(config, {
      args: [BigInt(questionId)],
    });
    return Number(arbitrationRequest[2]);
  }

  const requester = await readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester(config, {
    args: [BigInt(questionId)],
    chainId: mainnet.id,
  });

  if (requester === zeroAddress) {
    return 0;
  }

  const arbitrationRequest = await readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests(config, {
    args: [BigInt(questionId), requester],
    chainId: mainnet.id,
  });

  return Number(arbitrationRequest[2]);
}

export const useArbitrationDisputeId = (questionId: `0x${string}`, chainId: SupportedChain) => {
  return useQuery<number, Error>({
    queryKey: ["useArbitrationDisputeId", questionId],
    queryFn: async () => {
      return getArbitrationDisputeId(questionId, chainId);
    },
  });
};
