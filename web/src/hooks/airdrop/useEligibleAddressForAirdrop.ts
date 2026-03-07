import { config } from "@/wagmi";
import type { SupportedChain } from "@seer-pm/sdk";
import { readGovernedRecipientIsEligible } from "@seer-pm/sdk/contracts/multi-drop";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { gnosis } from "viem/chains";

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
