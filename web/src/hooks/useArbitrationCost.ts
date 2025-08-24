import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import { SupportedChain, gnosis, mainnet, sepolia } from "@/lib/chains";
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
    chainId === mainnet.id
      ? [
          readRealitioV2_1ArbitratorWithAppealsArbitrator(config, { chainId: mainnet.id }),
          readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData(config, { chainId: mainnet.id }),
        ]
      : chainId === sepolia.id
        ? [
            readRealitioV2_1ArbitratorWithAppealsArbitrator(config, { chainId: sepolia.id }),
            readRealitioV2_1ArbitratorWithAppealsArbitratorExtraData(config, { chainId: sepolia.id }),
          ]
        : chainId === gnosis.id
          ? [
              readRealitioForeignArbitrationProxyWithAppealsArbitrator(config, { chainId: mainnet.id }),
              readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData(config, { chainId: mainnet.id }),
            ]
          : [
              readRealitioForeignProxyOptimismArbitrator(config, { chainId: mainnet.id }),
              readRealitioForeignProxyOptimismArbitratorExtraData(config, { chainId: mainnet.id }),
            ],
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
