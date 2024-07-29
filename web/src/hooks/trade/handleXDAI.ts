import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { ChainId, WXDAI } from "@swapr/sdk";
import { writeContract } from "@wagmi/core";

interface HandleXDAIProps {
  amount: bigint;
  chainId: ChainId;
}

const WXDAI_ABI = [
  {
    constant: false,
    inputs: [{ name: "wad", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "deposit",
    outputs: [],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
] as const;
export async function unwrapXDAI({ chainId, amount }: HandleXDAIProps) {
  const unwrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: WXDAI[chainId].address as `0x${string}`,
        abi: WXDAI_ABI,
        functionName: "withdraw",
        args: [amount],
        chainId: chainId,
      }),
    { txSent: { title: "Unwrapping..." }, txSuccess: { title: "Trade executed!" } },
  );
  if (!unwrappedResult.status) {
    throw unwrappedResult.error;
  }
  return unwrappedResult.receipt;
}

export async function wrapXDAI({ chainId, amount }: HandleXDAIProps) {
  const wrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: WXDAI[chainId].address as `0x${string}`,
        abi: WXDAI_ABI,
        functionName: "deposit",
        args: [],
        value: amount,
        chainId: chainId,
      }),
    { txSent: { title: "Wrapping..." }, txSuccess: { title: "Trade executed!" } },
  );
  if (!wrappedResult.status) {
    throw wrappedResult.error;
  }
  return wrappedResult.receipt;
}
