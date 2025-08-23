import { SupportedChain, mainnet } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { gnosis, sepolia } from "viem/chains";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
  readRealitioForeignProxyOptimismArbitrationIdToRequester,
  readRealitioForeignProxyOptimismArbitrationRequests,
  readRealitioV2_1ArbitratorWithAppealsArbitrationRequests,
} from "./contracts/generated-arbitrators";

interface ArbitrationRequest {
  status: number;
  disputeId: bigint;
}

export async function getArbitrationRequest(
  questionId: `0x${string}`,
  chainId: SupportedChain,
): Promise<ArbitrationRequest> {
  if (chainId === mainnet.id || chainId === sepolia.id) {
    const [status, , disputeId] = await readRealitioV2_1ArbitratorWithAppealsArbitrationRequests(config, {
      args: [BigInt(questionId)],
      chainId: chainId,
    });

    return { status, disputeId };
  }

  const readArbitrationIdToRequester =
    chainId === gnosis.id
      ? readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester
      : readRealitioForeignProxyOptimismArbitrationIdToRequester;

  const requester = await readArbitrationIdToRequester(config, {
    args: [BigInt(questionId)],
    chainId: mainnet.id,
  });

  if (requester === zeroAddress) {
    return { status: 0, disputeId: 0n };
  }

  const readArbitrationRequests =
    chainId === gnosis.id
      ? readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests
      : readRealitioForeignProxyOptimismArbitrationRequests;

  const [status, , disputeId] = await readArbitrationRequests(config, {
    args: [BigInt(questionId), requester],
    chainId: mainnet.id,
  });

  return { status, disputeId };
}

export const useArbitrationRequest = (questionId: `0x${string}`, chainId: SupportedChain) => {
  return useQuery<ArbitrationRequest, Error>({
    queryKey: ["useArbitrationRequest", questionId, chainId],
    queryFn: async () => {
      return await getArbitrationRequest(questionId, chainId);
    },
  });
};
