import { PSM3_ABI, PSM3_REFERRAL_CODE } from "@/abi/psm3";
import { useApproveTokens } from "@/hooks/useApproveTokens";
import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import { PSM3_ADDRESS } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { Execution, SupportedChain, fetchNeededApprovals, getApprovals7702 } from "@seer-pm/sdk";
import { useMutation, useQuery } from "@tanstack/react-query";
import { readContract, sendCalls, writeContract } from "@wagmi/core";
import { Address, Client, encodeFunctionData, erc20Abi } from "viem";
import { useAccount, useClient } from "wagmi";

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
      return await readContract(config, {
        address: psm3Address!,
        abi: PSM3_ABI,
        functionName: "previewSwapExactIn",
        args: [assetIn!, assetOut!, amountIn!],
        chainId,
      });
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

function swapExactInExecution(psm3Address: Address, params: Psm3SwapParams & { receiver: Address }): Execution {
  return {
    to: psm3Address,
    value: 0n,
    data: encodeFunctionData({
      abi: PSM3_ABI,
      functionName: "swapExactIn",
      args: [
        params.assetIn,
        params.assetOut,
        params.amountIn,
        params.minAmountOut,
        params.receiver,
        PSM3_REFERRAL_CODE,
      ],
    }),
    chainId: params.chainId,
  };
}

const usePsm3SwapLegacy = () => {
  const { address } = useAccount();
  const approveTokens = useApproveTokens();

  return useMutation({
    mutationFn: async (params: Psm3SwapParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      const psm3Address = PSM3_ADDRESS[params.chainId];
      if (!psm3Address) {
        throw new Error("PSM3 not available");
      }

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
            args: [params.assetIn, params.assetOut, params.amountIn, params.minAmountOut, address, PSM3_REFERRAL_CODE],
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
  const psm3Address = PSM3_ADDRESS[chainId];
  if (!psm3Address) {
    throw new Error("PSM3 not available");
  }
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

  calls.push(swapExactInExecution(psm3Address, { ...params, receiver: address }));

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
  const client = useClient();

  return useMutation({
    mutationFn: async (params: Psm3SwapParams) => {
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
