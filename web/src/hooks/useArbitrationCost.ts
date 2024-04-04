import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { mainnet } from "viem/chains";
import {
  readRealitioForeignArbitrationProxyArbitrator,
  readRealitioForeignArbitrationProxyArbitratorExtraData,
} from "./contracts/generated";

async function getArbitrationCost(): Promise<bigint> {
  const [arbitrator, arbitratorExtraData] = await Promise.all([
    await readRealitioForeignArbitrationProxyArbitrator(config, { chainId: mainnet.id }),
    await readRealitioForeignArbitrationProxyArbitratorExtraData(config, { chainId: mainnet.id }),
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
