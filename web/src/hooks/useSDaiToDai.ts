import { SupportedChain, gnosis, mainnet } from "@/lib/chains";
import { isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { Address } from "viem";

const SDAI_ADDRESSES: Record<number, Address> = {
  [mainnet.id]: "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
  [gnosis.id]: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
};

const SDAI_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    name: "previewRedeem",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const useSDaiToDai = (sDaiAmount: bigint, chainId: SupportedChain) => {
  return useQuery<bigint | undefined, Error>({
    queryKey: ["useSdaiToDai", sDaiAmount.toString(), chainId],
    queryFn: async () => {
      if (!isUndefined(SDAI_ADDRESSES[chainId!])) {
        return readContract(config, {
          address: SDAI_ADDRESSES[chainId!],
          abi: SDAI_ABI,
          functionName: "previewRedeem",
          args: [sDaiAmount],
          chainId: chainId,
        });
      }

      return sDaiAmount;
    },
  });
};
