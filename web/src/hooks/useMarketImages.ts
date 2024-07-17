import { SupportedChain } from "@/lib/chains";
import { curateGraphQLClient } from "@/lib/subgraph";
import { isUndefined } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { lightGeneralizedTcrAddress } from "./contracts/generated";
import { Status, getSdk } from "./queries/generated";

export const useMarketImages = (marketId: Address, chainId: SupportedChain, registered = true) => {
  const { address: currentUserAddress } = useAccount();
  const addressRef = useRef(currentUserAddress);
  useEffect(() => {
    addressRef.current = currentUserAddress;
  }, [currentUserAddress]);
  return useQuery<{ market: string; outcomes: string[] }, Error>({
    queryKey: ["useMarketImages", marketId, chainId],
    queryFn: async () => {
      const client = curateGraphQLClient(chainId);

      // @ts-ignore
      const registryAddress = lightGeneralizedTcrAddress[chainId];

      if (client && !isUndefined(registryAddress)) {
        let { litems } = await getSdk(client).GetImages({
          where: {
            // status: registered ? Status.Registered : undefined,
            registryAddress,
            key0_contains_nocase: marketId,
          },
        });
        litems = litems.filter((item) => {
          if (item.latestRequester && item.latestRequester.toLowerCase() === addressRef.current?.toLowerCase()) {
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
      }

      throw new Error("Subgraph not available");
    },
    retry: false,
  });
};
