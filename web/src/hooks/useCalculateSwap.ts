import { MaverickPoolInformationAbi } from "@/abi/MaverickPoolInformationAbi";
import { getConfigAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { simulateContract } from "@wagmi/core";
import { Address, parseUnits } from "viem";
import { SwapConfig, getSwapConfig } from "./useSwapTokens";

interface CalculateSwap extends SwapConfig {
  output: bigint;
}

export const useCalculateSwap = (
  chainId: number,
  pool: Address,
  amount: number,
  outcomeToken: Address,
  swapType: "buy" | "sell",
) => {
  return useQuery<CalculateSwap | undefined, Error>({
    queryKey: ["useCalculateSwap", chainId, pool, amount.toString(), outcomeToken, swapType],
    retry: false,
    queryFn: async () => {
      const swapConfig = getSwapConfig(swapType, pool, outcomeToken, chainId);

      const parsedAmount = parseUnits(String(amount.toString()), swapConfig.decimals);

      const output = (
        await simulateContract(config, {
          abi: MaverickPoolInformationAbi,
          address: getConfigAddress("POOL_INFORMATION", chainId),
          functionName: "calculateSwap",
          args: [pool, parsedAmount, swapConfig.tokenAIn, false, 0n],
          chainId,
        })
      ).result;

      return {
        ...swapConfig,
        output,
      };
    },
  });
};
