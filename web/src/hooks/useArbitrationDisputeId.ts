import { mainnet } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester,
  readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests,
} from "./contracts/generated";

async function getArbitrationDisputeId(questionId: `0x${string}`): Promise<number> {
  const requester = await readRealitioForeignArbitrationProxyWithAppealsArbitrationIdToRequester(config, {
    args: [BigInt(questionId)],
    chainId: mainnet.id,
  });

  if (requester === zeroAddress) {
    return 0;
  }

  const arbitration = await readRealitioForeignArbitrationProxyWithAppealsArbitrationRequests(config, {
    args: [BigInt(questionId), requester],
    chainId: mainnet.id,
  });

  return Number(arbitration[2]);
}

export const useArbitrationDisputeId = (questionId: `0x${string}`) => {
  return useQuery<number, Error>({
    queryKey: ["useArbitrationDisputeId", questionId],
    queryFn: async () => {
      return getArbitrationDisputeId(questionId);
    },
  });
};
