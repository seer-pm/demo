import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient } from "@/lib/subgraph";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { lightGeneralizedTcrAddress } from "./contracts/generated";
import { getSdk } from "./queries/generated";

export type VerificationStatus = "verified" | "verifying" | "not_verified";
export type VerificationStatusResult = { status: VerificationStatus; itemID?: string };

export const useVerificationStatus = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<VerificationStatusResult | undefined, Error>({
    queryKey: ["useVerificationStatus", marketId, chainId],
    queryFn: async () => {
      const client = curateGraphQLClient(chainId);

      // @ts-ignore
      const registryAddress = lightGeneralizedTcrAddress[chainId];

      if (client && !isUndefined(registryAddress)) {
        const { litems } = await getSdk(client).GetImages({
          where: {
            registryAddress,
            key0_contains_nocase: marketId,
          },
        });

        const registeredItem = litems.find((litem) => litem.status === "Registered");
        if (!isUndefined(registeredItem)) {
          return { status: "verified", itemID: registeredItem.itemID };
        }

        const pendingItem = litems.find((litem) => litem.status === "RegistrationRequested");
        if (!isUndefined(pendingItem)) {
          return { status: "verifying", itemID: pendingItem.itemID };
        }

        return { status: "not_verified" };
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};
