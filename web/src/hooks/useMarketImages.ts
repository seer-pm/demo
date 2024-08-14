import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient } from "@/lib/subgraph";
import { useQuery } from "@tanstack/react-query";
import * as batshit from "@yornaath/batshit";
import memoize from "micro-memoize";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { lightGeneralizedTcrAddress } from "./contracts/generated";
import { Status, getSdk } from "./queries/generated";

const images = memoize((chainId: SupportedChain) => {
  return batshit.create({
    name: "images",
    fetcher: async (ids: Address[]) => {
      // @ts-ignore
      const registryAddress = lightGeneralizedTcrAddress[chainId];

      const client = curateGraphQLClient(chainId);

      if (!client) {
        throw new Error("Subgraph not available");
      }

      const { litems } = await getSdk(client).GetImages({
        where: {
          // status: registered ? Status.Registered : undefined,
          registryAddress,
          key0_in: ids,
        },
      });
      return litems;
    },
    scheduler: batshit.windowScheduler(10),
    resolver: (images, marketId) => images.filter((image) => image.key0 === marketId),
  });
});

export const useMarketImages = (marketId: Address, chainId: SupportedChain, registered = true) => {
  const { address: currentUserAddress } = useAccount();

  return useQuery<{ market: string; outcomes: string[] }, Error>({
    queryKey: ["useMarketImages", marketId, chainId, currentUserAddress],
    queryFn: async () => {
      const litems = (await images(chainId).fetch(marketId)).filter((item) => {
        if (item.latestRequester && item.latestRequester.toLowerCase() === currentUserAddress?.toLowerCase()) {
          return true;
        }
        return registered ? item.status === Status.Registered : true;
      });
      if (litems.length === 0) {
        throw new Error("Market images not found");
      }

      const item = litems[0];

      const metadataResult = await fetch(`https://ipfs.kleros.io${item.data}`);
      const imagesIpfsPath = (await metadataResult.json())?.values?.Images;

      if (!imagesIpfsPath) {
        throw new Error("Market images not found");
      }

      const imagesResult = await fetch(`https://ipfs.kleros.io${imagesIpfsPath}`);
      const imagesMetadata = await imagesResult.json();

      return {
        market: `https://ipfs.kleros.io${imagesMetadata.market}`,
        outcomes: ((imagesMetadata.outcomes || []) as string[]).map((path) => `https://ipfs.kleros.io${path}`),
      };
    },
    retry: false,
  });
};
