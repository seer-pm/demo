import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import { mainnet } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import {
  readRealitioForeignArbitrationProxyWithAppealsArbitrator,
  readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData,
} from "./contracts/generated";

async function getArbitrationCost(): Promise<bigint> {
  const [arbitrator, arbitratorExtraData] = await Promise.all([
    await readRealitioForeignArbitrationProxyWithAppealsArbitrator(config, { chainId: mainnet.id }),
    await readRealitioForeignArbitrationProxyWithAppealsArbitratorExtraData(config, { chainId: mainnet.id }),
  ]);

  return await readContract(config, {
    address: arbitrator,
    abi: ArbitratorAbi,
    functionName: "arbitrationCost",
    args: [arbitratorExtraData],
    chainId: mainnet.id,
  });
}

export const useArbitrationCost = () => {
  return useQuery<bigint, Error>({
    queryKey: ["useArbitrationCost"],
    queryFn: async () => {
      return getArbitrationCost();
    },
  });
};
