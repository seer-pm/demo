import { getSdk as getSeerSdk } from "@/hooks/queries/gql-generated-seer";
import { SupportedChain, gnosis, mainnet, optimism, sepolia } from "@/lib/chains";
import { graphQLClient } from "@/lib/subgraph";
import { useQuery } from "@tanstack/react-query";
import {
  realitioForeignArbitrationProxyWithAppealsAddress,
  realitioForeignProxyOptimismAddress,
  realitioV2_1ArbitratorWithAppealsAddress,
} from "./contracts/generated-arbitrators";

export const useMarketRulesPolicy = (chainId: SupportedChain | undefined) => {
  return useQuery<string, Error>({
    enabled: !!chainId,
    queryKey: ["useMarketRulesPolicy", chainId],
    queryFn: async () => {
      const mainnetId = mainnet.id;
      const client = graphQLClient(mainnetId);

      if (!client) {
        throw new Error("Subgraph not available");
      }

      const { arbitratorMetadata } = await getSeerSdk(client).GetArbitratorMetadata({
        id: {
          [mainnet.id]: realitioV2_1ArbitratorWithAppealsAddress[mainnetId],
          [sepolia.id]: realitioV2_1ArbitratorWithAppealsAddress[sepolia.id],
          [gnosis.id]: realitioForeignArbitrationProxyWithAppealsAddress[mainnetId],
          [optimism.id]: realitioForeignProxyOptimismAddress[mainnetId],
        }[chainId!],
      });

      if (!arbitratorMetadata?.registrationMetaEvidenceURI) {
        throw new Error("Missing arbitrator metadata");
      }

      const metadataResult = await fetch(`https://cdn.kleros.link${arbitratorMetadata.registrationMetaEvidenceURI}`);
      const fileURI = (await metadataResult.json())?.fileURI;

      return fileURI ? `https://cdn.kleros.link${fileURI}` : "#";
    },
  });
};
