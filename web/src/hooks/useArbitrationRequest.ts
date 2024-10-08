import { SupportedChain, mainnet } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
  readRealitioV2_1ArbitratorWithAppealsArbitrationRequests,
} from "./contracts/generated";

interface ArbitrationRequest {
  status: number;
  disputeId: bigint;
}

export async function getArbitrationRequest(
  questionId: `0x${string}`,
  chainId: SupportedChain,
): Promise<ArbitrationRequest> {
  if (chainId === mainnet.id) {
    const [status, , disputeId] = await readRealitioV2_1ArbitratorWithAppealsArbitrationRequests(config, {
      args: [BigInt(questionId)],
    });

    return { status, disputeId };
  }

  const requester = await readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester(config, {
    args: [BigInt(questionId)],
    chainId: mainnet.id,
  });

  if (requester === zeroAddress) {
    return { status: 0, disputeId: 0n };
  }

  const [status, , disputeId] = await readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests(config, {
    args: [BigInt(questionId), requester],
    chainId: mainnet.id,
  });

  return { status, disputeId };
}

export const useArbitrationRequest = (questionId: `0x${string}`, chainId: SupportedChain) => {
  return useQuery<ArbitrationRequest, Error>({
    queryKey: ["useArbitrationRequest", questionId],
    queryFn: async () => {
      return await getArbitrationRequest(questionId, chainId);
    },
  });
};
