import { fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useGlobalState } from "../useGlobalState";

export const useCollectionMarkets = (collectionId: string | undefined) => {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<Address[] | undefined, Error>({
    queryKey: ["useCollectionMarkets", collectionId, accessToken],
    queryFn: async () => {
      //only fetch auth when !collectionId
      if (!collectionId) {
        if (isAccessTokenExpired(accessToken)) {
          return [];
        }
        return fetchAuth(accessToken, "/.netlify/functions/collections", "GET");
      }
      return fetch(`/.netlify/functions/collections/${collectionId}`).then((res) => res.json());
    },
  });
};
