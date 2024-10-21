import { COLLATERAL_TOKENS } from "@/lib/config";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { ChainId } from "@swapr/sdk";
import { useQuery } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
import { Address } from "viem";

interface HandleSDAIProps {
  amount: bigint;
  chainId: ChainId;
  owner: Address;
}

const SDAI_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    name: "convertToAssets",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
    ],
    name: "convertToShares",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "assets",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "redeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ADAPTER_ABI = [
  {
    inputs: [{ internalType: "address", name: "receiver", type: "address" }],
    name: "depositXDAI",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "redeemXDAI",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const S_DAI_ADAPTER = "0xD499b51fcFc66bd31248ef4b28d656d67E591A94";

export async function convertFromSDAI({ chainId, amount }: Omit<HandleSDAIProps, "owner">) {
  return readContract(config, {
    address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
    abi: SDAI_ABI,
    functionName: "convertToAssets",
    args: [amount],
    chainId: chainId,
  });
}

export async function convertToSDAI({ chainId, amount }: Omit<HandleSDAIProps, "owner">) {
  return readContract(config, {
    address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
    abi: SDAI_ABI,
    functionName: "convertToShares",
    args: [amount],
    chainId: chainId,
  });
}

export async function redeemFromSDAI({ chainId, amount, owner }: HandleSDAIProps) {
  const unwrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
        abi: SDAI_ABI,
        functionName: "redeem",
        args: [amount, owner, owner],
        chainId: chainId,
      }),
    { txSent: { title: "Redeeming..." }, txSuccess: { title: "Redeemed!" } },
  );
  if (!unwrappedResult.status) {
    throw unwrappedResult.error;
  }
  return unwrappedResult.receipt;
}

export async function depositToSDAI({ chainId, amount, owner }: HandleSDAIProps) {
  const wrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: COLLATERAL_TOKENS[chainId].primary.address as `0x${string}`,
        abi: SDAI_ABI,
        functionName: "deposit",
        args: [amount, owner],
        chainId: chainId,
      }),
    { txSent: { title: "Depositing..." }, txSuccess: { title: "Deposited!" } },
  );
  if (!wrappedResult.status) {
    throw wrappedResult.error;
  }
  return wrappedResult.receipt;
}

export async function redeemFromSDAIToNative({ chainId, amount, owner }: HandleSDAIProps) {
  if (!owner) throw "Account not found!";
  const unwrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: S_DAI_ADAPTER,
        abi: ADAPTER_ABI,
        functionName: "redeemXDAI",
        args: [amount, owner],
        chainId: chainId,
      }),
    { txSent: { title: "Redeeming..." }, txSuccess: { title: "Redeemed!" } },
  );
  if (!unwrappedResult.status) {
    throw unwrappedResult.error;
  }
  return unwrappedResult.receipt;
}

export async function depositFromNativeToSDAI({ chainId, amount, owner }: HandleSDAIProps) {
  if (!owner) throw "Account not found!";
  const wrappedResult = await toastifyTx(
    () =>
      writeContract(config, {
        address: S_DAI_ADAPTER,
        abi: ADAPTER_ABI,
        functionName: "depositXDAI",
        args: [owner],
        value: amount,
        chainId: chainId,
      }),
    { txSent: { title: "Depositing..." }, txSuccess: { title: "Deposited!" } },
  );
  if (!wrappedResult.status) {
    throw wrappedResult.error;
  }
  return wrappedResult.receipt;
}

export function useConvertToShares(amount: bigint, chainId: number) {
  return useQuery<bigint | undefined, Error>({
    enabled: amount > 0,
    queryKey: ["useConvertToShares", amount.toString(), chainId],
    queryFn: async () => {
      return convertToSDAI({ chainId, amount });
    },
  });
}

export function useConvertToAssets(amount: bigint, chainId: number) {
  return useQuery<bigint | undefined, Error>({
    enabled: amount > 0,
    queryKey: ["useConvertToAssets", amount.toString(), chainId],
    queryFn: async () => {
      return convertFromSDAI({ chainId, amount });
    },
  });
}
