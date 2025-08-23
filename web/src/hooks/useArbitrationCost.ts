import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import { SupportedChain, gnosis, mainnet, optimism, sepolia } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrator,
  readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData,
  readRealitioForeignProxyOptimismArbitrator,
  readRealitioForeignProxyOptimismArbitratorExtraData,
  readRealitioV2_1ArbitratorWithAppealsArbitrator,
  readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData,
} from "./contracts/generated-arbitrators";

async function getArbitrationCost(chainId: SupportedChain): Promise<bigint> {
  const [arbitrator, arbitratorExtraData] = await Promise.all(
    {
      [mainnet.id]: [
        readRealitioV2_1ArbitratorWithAppealsArbitrator(config, { chainId: mainnet.id }),
        readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData(config, { chainId: mainnet.id }),
      ],
      [sepolia.id]: [
        readRealitioV2_1ArbitratorWithAppealsArbitrator(config, { chainId: sepolia.id }),
        readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData(config, { chainId: sepolia.id }),
      ],
      [gnosis.id]: [
        readRealitioForeignArbitrationProxyWithAppealsArbitrator(config, { chainId: mainnet.id }),
        readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData(config, { chainId: mainnet.id }),
      ],
      [optimism.id]: [
        readRealitioForeignProxyOptimismArbitrator(config, { chainId: mainnet.id }),
        readRealitioForeignProxyOptimismArbitratorExtraData(config, { chainId: mainnet.id }),
      ],
    }[chainId],
  );

  return await readContract(config, {
    address: arbitrator,
    abi: ArbitratorAbi,
    functionName: "arbitrationCost",
    args: [arbitratorExtraData],
    chainId: mainnet.id,
  });
}

export const useArbitrationCost = (chainId: SupportedChain) => {
  return useQuery<bigint, Error>({
    queryKey: ["useArbitrationCost"],
    queryFn: async () => {
      return getArbitrationCost(chainId);
    },
  });
};
