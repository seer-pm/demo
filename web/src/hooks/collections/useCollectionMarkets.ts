import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useCollectionMarkets = (collectionId: string | undefined) => {
  return useQuery<Address[] | undefined, Error>({
    queryKey: ["useCollectionMarkets", collectionId],
    queryFn: async () => {
      return fetch(`/.netlify/functions/collections/${collectionId ?? ""}`).then((res) => res.json());
    },
  });
};
