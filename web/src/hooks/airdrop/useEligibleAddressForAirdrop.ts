import { SupportedChain } from "@/lib/chains";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { readGovernedRecipientIsEligible } from "../contracts/generated";

export const useEligibleAddressForAirdrop = (account: Address | undefined, chainId: SupportedChain) => {
  return useQuery<boolean | undefined, Error>({
    enabled: !!account,
    queryKey: ["useEligibleAddressForAirdrop", account],
    queryFn: async () => {
      if (chainId !== gnosis.id) {
        return;
      }
      return await readGovernedRecipientIsEligible(config, {
        args: [account!],
        chainId,
      });
    },
  });
};
