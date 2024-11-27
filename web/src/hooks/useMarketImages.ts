import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient } from "@/lib/subgraph";
import { isTwoStringsEqual, isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import memoize from "micro-memoize";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { lightGeneralizedTcrAddress } from "./contracts/generated";
import { Status, getSdk } from "./queries/gql-generated-curate";

export const getMarketImages = memoize((chainId: SupportedChain) => {
  return batshit.create({
    name: "images",
    fetcher: async (_ids: Address[]) => {
      // @ts-ignore
      const registryAddress = lightGeneralizedTcrAddress[chainId];

      const client = curateGraphQLClient(chainId);

      if (!client || isUndefined(registryAddress)) {
        throw new Error("Subgraph not available");
      }

      const { litems } = await getSdk(client).GetImages({
        where: {
          // status: registered ? Status.Registered : undefined,
          registryAddress,
        },
      });
      return litems;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (litems, marketId) =>
      litems.filter((litem) => litem.metadata?.props?.some((prop) => isTwoStringsEqual(prop.value, marketId))),
  });
});

export const useMarketImages = (marketId: Address, chainId: SupportedChain, registered = true) => {
  const { address: currentUserAddress } = useAccount();

  return useQuery<{ market: string; outcomes: string[] }, Error>({
    queryKey: ["useMarketImages", marketId, chainId, currentUserAddress],
    queryFn: async () => {
      const litems = (await getMarketImages(chainId).fetch(marketId)).filter((item) => {
        if (item.latestRequester && item.latestRequester.toLowerCase() === currentUserAddress?.toLowerCase()) {
          return true;
        }
        const isVerifiedBeforeClearing =
          item.status === Status.ClearingRequested &&
          item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
        return registered ? item.status === Status.Registered || isVerifiedBeforeClearing : true;
      });
      if (litems.length === 0) {
        throw new Error("Market images not found");
      }

      const item = litems[0];

      const metadataResult = await fetch(`https://cdn.kleros.link${item.data}`);
      const imagesIpfsPath = (await metadataResult.json())?.values?.Images;

      if (!imagesIpfsPath) {
        throw new Error("Market images not found");
      }

      const imagesResult = await fetch(`https://cdn.kleros.link${imagesIpfsPath}`);
      const imagesMetadata = await imagesResult.json();

      return {
        market: `https://cdn.kleros.link${imagesMetadata.market}`,
        outcomes: ((imagesMetadata.outcomes || []) as string[]).map((path) => `https://cdn.kleros.link${path}`),
      };
    },
    retry: false,
  });
};
