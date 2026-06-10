import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import {
  Execution,
  PSM3_ABI,
  PSM3_ADDRESS,
  SupportedChain,
  buildPsm3SwapExactInExecution,
  fetchNeededApprovals,
  getApprovals7702,
  getPsm3Address,
  previewPsm3SwapExactIn,
} from "@seer-pm/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getConnectorClient, getPublicClient, readContract, sendCalls, writeContract } from "@wagmi/core";
import { Address, Client, erc20Abi } from "viem";
import { useAccount } from "wagmi";
import { useApproveTokens } from "./useApproveTokens";
import { useCheck7702Support } from "./useCheck7702Support";

export function usePsm3Preview(
  chainId: SupportedChain,
  assetIn: Address | undefined,
  assetOut: Address | undefined,
  amountIn: bigint | undefined,
) {
  const psm3Address = PSM3_ADDRESS[chainId];

  return useQuery({
    queryKey: ["psm3Preview", chainId, assetIn, assetOut, amountIn?.toString()],
    enabled: !!psm3Address && !!assetIn && !!assetOut && !!amountIn && amountIn > 0n,
    queryFn: async () => {
      const publicClient = getPublicClient(config, { chainId });
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      return previewPsm3SwapExactIn(publicClient, chainId, assetIn!, assetOut!, amountIn!);
    },
  });
}

type Psm3SwapParams = {
  chainId: SupportedChain;
  assetIn: Address;
  assetOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
};

const usePsm3SwapLegacy = () => {
  const { address } = useAccount();
  const approveTokens = useApproveTokens();

  return useMutation({
    mutationFn: async (params: Psm3SwapParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      const psm3Address = getPsm3Address(params.chainId);

      const allowance = await readContract(config, {
        address: params.assetIn,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, psm3Address],
        chainId: params.chainId,
      });

      if (allowance < params.amountIn) {
        await approveTokens.mutateAsync({
          tokenAddress: params.assetIn,
          spender: psm3Address,
          amount: params.amountIn,
          chainId: params.chainId,
        });
      }

      const result = await toastifyTx(
        () =>
          writeContract(config, {
            address: psm3Address,
            abi: PSM3_ABI,
            functionName: "swapExactIn",
            args: [params.assetIn, params.assetOut, params.amountIn, params.minAmountOut, address, 1n],
            chainId: params.chainId,
          }),
        {
          txSent: { title: "Swapping..." },
          txSuccess: { title: "Swap completed." },
        },
      );

      if (!result.status) {
        throw result.error;
      }

      queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
      queryClient.invalidateQueries({ queryKey: ["psm3Preview"] });
      return result;
    },
  });
};

async function psm3Swap7702(params: Psm3SwapParams, client: Client): Promise<unknown> {
  const { chainId, assetIn, amountIn } = params;
  const psm3Address = getPsm3Address(chainId);
  const address = client.account?.address;
  if (!address) {
    throw new Error("Wallet account not connected");
  }

  const needed = await fetchNeededApprovals(client, [assetIn], address, psm3Address, [amountIn]);
  const calls: Execution[] = getApprovals7702({
    tokensAddresses: needed.map((n) => n.tokenAddress),
    account: address,
    spender: psm3Address,
    amounts: needed.map((n) => n.amount),
    chainId,
  });

  calls.push(
    buildPsm3SwapExactInExecution({
      chainId,
      assetIn: params.assetIn,
      assetOut: params.assetOut,
      amountIn: params.amountIn,
      minAmountOut: params.minAmountOut,
      receiver: address,
    }),
  );

  const result = await toastifyTx(
    () =>
      sendCalls(config, {
        calls,
        chainId,
      }),
    {
      txSent: { title: "Swapping..." },
      txSuccess: { title: "Swap completed." },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  queryClient.invalidateQueries({ queryKey: ["useTokenBalance"] });
  queryClient.invalidateQueries({ queryKey: ["psm3Preview"] });
  return result;
}

const usePsm3Swap7702Hook = () => {
  return useMutation({
    mutationFn: async (params: Psm3SwapParams) => {
      const client = await getConnectorClient(config, { chainId: params.chainId });
      if (!client?.account) {
        throw new Error("Wallet client not connected");
      }
      return psm3Swap7702(params, client);
    },
  });
};

export function usePsm3Swap() {
  const supports7702 = useCheck7702Support();
  const legacy = usePsm3SwapLegacy();
  const eip7702 = usePsm3Swap7702Hook();

  return supports7702 ? eip7702 : legacy;
}
