import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { readMultiDropClaimed } from "../contracts/generated";

export const useGetClaimStatus = (account: Address | undefined, chainId: SupportedChain) => {
  return useQuery<boolean | undefined, Error>({
    enabled: !!account,
    queryKey: ["useGetClaimStatus", account],
    queryFn: async () => {
      if (chainId !== gnosis.id) {
        return;
      }
      return await readMultiDropClaimed(config, {
        args: [account!],
        chainId,
      });
    },
  });
};
