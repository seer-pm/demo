import { MaverickRouterAbi } from "@/abi/MaverickRouterAbi";
import { COLLATERAL_TOKENS, getConfigAddress } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { readContract, waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Address, Hex, TransactionReceipt, encodePacked, erc20Abi, parseUnits } from "viem";

interface SwapTokensProps {
  account: Address;
  chainId: number;
  amount: number;
  amountOutMinimum: bigint;
  type: "buy" | "sell";
  outcomeToken: Address;
  pool: Address;
  isMainCollateral: boolean;
}

async function swapTokens({
  account,
  chainId,
  amount,
  amountOutMinimum,
  type,
  outcomeToken,
  pool /*isMainCollateral*/,
}: SwapTokensProps): Promise<TransactionReceipt> {
  const parsedAmount = parseUnits(String(amount), 18);

  const swapConfig = getSwapConfig(type, pool, outcomeToken, chainId);

  const MAVERICK_ROUTER = getConfigAddress("MAVERICK_ROUTER", chainId);

  if (swapConfig.token !== NATIVE_TOKEN) {
    const allowance = await readContract(config, {
      abi: erc20Abi,
      address: swapConfig.token,
      functionName: "allowance",
      args: [account, MAVERICK_ROUTER],
    });

    if (allowance < parsedAmount) {
      const hash = await writeContract(config, {
        address: swapConfig.token,
        abi: erc20Abi,
        functionName: "approve",
        args: [MAVERICK_ROUTER, parsedAmount],
      });

      await waitForTransactionReceipt(config, {
        hash,
      });
    }
  }

  const hash = await writeContract(config, {
    address: MAVERICK_ROUTER,
    abi: MaverickRouterAbi,
    functionName: "exactInput",
    args: [
      {
        path: swapConfig.path,
        recipient: account,
        deadline: BigInt(1e13),
        amountIn: parsedAmount,
        amountOutMinimum: amountOutMinimum,
      },
    ],
  });

  const transactionReceipt = await waitForTransactionReceipt(config, {
    hash,
  });

  return transactionReceipt as TransactionReceipt;
}

export interface SwapConfig {
  path: Hex;
  token: Address;
  decimals: number;
  tokenAIn: boolean;
}

export function getSwapConfig(type: "buy" | "sell", pool: Address, outcomeToken: Address, chainId: number): SwapConfig {
  const collateral = COLLATERAL_TOKENS[chainId].primary.address;

  if (type === "buy") {
    // buying outcome tokens
    return {
      path: encodePacked(["address", "address", "address"], [collateral, pool, outcomeToken]),
      token: collateral,
      decimals: COLLATERAL_TOKENS[chainId].primary.decimals,
      tokenAIn: collateral < outcomeToken,
    };
  }

  // selling outcome tokens
  return {
    path: encodePacked(["address", "address", "address"], [outcomeToken, pool, collateral]),
    token: outcomeToken,
    decimals: 18,
    tokenAIn: outcomeToken < collateral,
  };
}

export const useSwapTokens = (onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: swapTokens,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["usePositions"] });
      queryClient.invalidateQueries({ queryKey: ["useERC20Balance"] });
      queryClient.invalidateQueries({ queryKey: ["useMarketPositions"] });
      onSuccess(data);
    },
  });
};
