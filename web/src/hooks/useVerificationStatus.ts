import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient } from "@/lib/subgraph";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { lightGeneralizedTcrAddress } from "./contracts/generated";
import { getSdk } from "./queries/gql-generated-curate";
import { getMarketImages } from "./useMarketImages";

export type VerificationStatus = "verified" | "verifying" | "not_verified";
export type VerificationStatusResult = { status: VerificationStatus; itemID?: string };

export const useVerificationStatus = (marketId: Address, chainId: SupportedChain) => {
  return useQuery<VerificationStatusResult | undefined, Error>({
    queryKey: ["useVerificationStatus", marketId, chainId],
    queryFn: async () => {
      const litems = await getMarketImages(chainId).fetch(marketId);

      const registeredItem = litems.find((litem) => litem.status === "Registered");
      if (!isUndefined(registeredItem)) {
        return { status: "verified", itemID: registeredItem.itemID };
      }

      const pendingItem = litems.find((litem) => litem.status === "RegistrationRequested");
      if (!isUndefined(pendingItem)) {
        return { status: "verifying", itemID: pendingItem.itemID };
      }

      return { status: "not_verified" };
    },
    retry: false,
  });
};

export const useVerificationStatusList = (chainId: SupportedChain) => {
  return useQuery<{ [key: string]: VerificationStatusResult } | undefined, Error>({
    queryKey: ["useVerificationStatus", chainId],
    queryFn: async () => {
      const client = curateGraphQLClient(chainId);

      // @ts-ignore
      const registryAddress = lightGeneralizedTcrAddress[chainId];

      if (client && !isUndefined(registryAddress)) {
        const { litems } = await getSdk(client).GetImages({
          where: {
            registryAddress,
          },
        });
        return litems.reduce(
          (obj, item) => {
            if (!item.key0) {
              return obj;
            }
            if (item.status === "Registered") {
              obj[item.key0.toLowerCase()] = { status: "verified", itemID: item.itemID };
              return obj;
            }
            if (item.status === "RegistrationRequested") {
              obj[item.key0.toLowerCase()] = { status: "verifying", itemID: item.itemID };
              return obj;
            }
            obj[item.key0.toLowerCase()] = { status: "not_verified" };
            return obj;
          },
          {} as { [key: string]: VerificationStatusResult },
        );
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};

export const defaultStatus = { status: "not_verified" as VerificationStatus };
