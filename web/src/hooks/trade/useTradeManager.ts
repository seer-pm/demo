import { queryClient } from "@/lib/query-client";
import { toastError, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { getAccount, simulateContract, writeContract } from "@wagmi/core";
import { gnosis } from "viem/chains";
import { tradeManagerAbi, tradeManagerAddress } from "../contracts/generated";
import { TradeManagerTokenPath } from "./useTradeQuoter";

interface TradeManagerProps {
  paths: TradeManagerTokenPath[];
  amountIn: bigint;
  amountOutMinimum: bigint;
  isUseNativeToken: boolean;
}

async function executeTradeManager({ paths, amountIn, amountOutMinimum, isUseNativeToken }: TradeManagerProps) {
  if (!paths.length) {
    throw {
      message: "Cannot swap!",
    };
  }
  const { connector, address } = getAccount(config);
  if (!address) {
    throw {
      message: "Account not found!",
    };
  }

  try {
    const { request } = await simulateContract(config, {
      address: tradeManagerAddress[gnosis.id],
      abi: tradeManagerAbi,
      functionName: "exactInput",
      args: [
        // biome-ignore lint/suspicious/noExplicitAny:
        paths as any,
        {
          recipient: address,
          originalRecipient: address,
          deadline: BigInt(Math.floor(new Date().getTime() / 1000) + 3600),
          amountIn: isUseNativeToken ? 0n : amountIn,
          amountOutMinimum,
        },
      ],
      ...(isUseNativeToken && {
        value: amountIn,
      }),
      chainId: gnosis.id,
      connector,
    });

    const writeResult = await toastifyTx(() => writeContract(config, request), {
      txSent: { title: "Executing trade..." },
      txSuccess: { title: "Trade executed!" },
    });

    if (!writeResult.status) {
      throw writeResult.error;
    }
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (e: any) {
    toastError({ title: e.details || e.message });
    throw e;
  }
}

export function useTradeManager(onSuccess: () => unknown) {
  return useMutation({
    mutationFn: executeTradeManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
      onSuccess();
    },
  });
}
