import { fetchAuth, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useGlobalState } from "./useGlobalState";

export const useFavorites = () => {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<Address[] | undefined, Error>({
    enabled: !isAccessTokenExpired(accessToken),
    queryKey: ["useFavorites"],
    queryFn: async () => {
      return fetchAuth(accessToken, "/.netlify/functions/collections", "GET");
    },
    refetchInterval: 1000, // Refetch every 1 seconds
  });
};
