import { PoolInformationAbi } from "@/abi/PoolInformationAbi";
import { getConfigAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { simulateContract } from "@wagmi/core";
import { Address } from "viem";

export const useCalculateSwap = (chainId: number, pool: Address, amount: bigint, tokenAIn: boolean, exactOutput: boolean, sqrtPriceLimit: bigint) => {
  return useQuery<bigint | undefined, Error>({
    queryKey: ["useCalculateSwap", pool, amount.toString(), tokenAIn, exactOutput, sqrtPriceLimit.toString()],
    queryFn: async () => {
      return (await simulateContract(config, {
        abi: PoolInformationAbi,
        address: getConfigAddress("POOL_INFORMATION", chainId),
        functionName: "calculateSwap",
        args: [pool, amount, tokenAIn, exactOutput, sqrtPriceLimit],
        chainId,
      })).result
    },
  });
};
