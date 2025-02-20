import { fetchAuth, getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useGlobalState } from "../useGlobalState";

export function useAllCollectionsMarkets() {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<{ collectionId: string; marketId: string }[]>({
    queryKey: ["useAllCollectionsMarkets"],
    enabled: !isAccessTokenExpired(accessToken),
    queryFn: async () => {
      return fetchAuth(accessToken, `${getAppUrl()}/.netlify/functions/collections-markets`, "GET").then((data) =>
        data.data.map((x: { collection_id: string; market_id: string }) => ({
          collectionId: x.collection_id?.toString(),
          marketId: x.market_id.toString(),
        })),
      );
    },
  });
}
