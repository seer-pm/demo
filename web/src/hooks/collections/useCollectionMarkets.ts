import { fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useGlobalState } from "../useGlobalState";

export const useCollectionMarkets = (collectionId: string | undefined) => {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<Address[] | undefined, Error>({
    enabled: !isAccessTokenExpired(accessToken),
    queryKey: ["useCollectionMarkets", collectionId],
    queryFn: async () => {
      return fetchAuth(accessToken, `/.netlify/functions/collections/${collectionId ?? ""}`, "GET");
    },
  });
};
