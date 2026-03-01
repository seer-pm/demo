import { SupportedChain } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { lightGeneralizedTcrAddress } from "@seer-pm/sdk/contracts/curate";
import { getSdk as getSeerSdk } from "@seer-pm/subgraph/seer";
import { useQuery } from "@tanstack/react-query";

export const useVerifiedMarketPolicy = (chainId: SupportedChain | undefined) => {
  return useQuery<string, Error>({
    enabled: !!chainId,
    queryKey: ["useVerifiedMarketPolicy", chainId],
    queryFn: async () => {
      const client = graphQLClient(chainId!);

      if (!client) {
        throw new Error("Subgraph not available");
      }

      const { curateMetadata } = await getSeerSdk(client).GetCurateMetadata({
        id: lightGeneralizedTcrAddress[chainId!],
      });

      if (!curateMetadata?.registrationMetaEvidenceURI) {
        throw new Error("Missing curate metadata");
      }

      const metadataResult = await fetch(`https://cdn.kleros.link${curateMetadata.registrationMetaEvidenceURI}`);
      const fileURI = (await metadataResult.json())?.fileURI;

      return fileURI ? `https://cdn.kleros.link${fileURI}` : "#";
    },
  });
};
