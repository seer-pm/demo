import { isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";
import { useGlobalState } from "./useGlobalState";

export const useFavorites = () => {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<Address[] | undefined, Error>({
    enabled: !isAccessTokenExpired(accessToken),
    queryKey: ["useFavorites"],
    queryFn: async () => {
      const response = await fetch("/.netlify/functions/collections", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorite markets: ${response.statusText}`);
      }
      return await response.json();
    },
  });
};
