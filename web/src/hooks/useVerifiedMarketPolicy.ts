import { getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { useQuery } from "@tanstack/react-query";
import { lightGeneralizedTcrAddress } from "./contracts/generated";

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
