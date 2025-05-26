import { SupportedChain } from "@/lib/chains";
import { toastError, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { getAccount, simulateContract } from "@wagmi/core";
import { TransactionReceipt } from "viem";
import { gnosis } from "viem/chains";
import { multiDropAbi, multiDropAddress, writeMultiDropClaim } from "../contracts/generated-multi-drop";

async function claimAirdrop(chainId: SupportedChain): Promise<TransactionReceipt | undefined> {
  if (chainId !== gnosis.id) {
    throw "Unsupported chain!";
  }
  try {
    // simulate claim first to save gas when failed
    const { connector } = getAccount(config);
    await simulateContract(config, {
      address: multiDropAddress[chainId],
      abi: multiDropAbi,
      functionName: "claim",
      args: [],
      chainId: chainId,
      connector,
    });
    // biome-ignore lint/suspicious/noExplicitAny:
  } catch (error: any) {
    toastError({ title: error.shortMessage ?? error.message });
    return;
  }
  const result = await toastifyTx(
    () =>
      writeMultiDropClaim(config, {
        args: [],
        chainId,
      }),
    {
      txSent: { title: "Claiming..." },
      txSuccess: { title: "Tokens claimed!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useClaimAirdrop = (onSuccess: (data: TransactionReceipt | undefined) => unknown) => {
  return useMutation({
    mutationFn: claimAirdrop,
    onSuccess,
  });
};
