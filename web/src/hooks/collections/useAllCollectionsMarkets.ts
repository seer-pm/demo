import { fetchAuth, getAppUrl, isAccessTokenExpired } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useGlobalState } from "../useGlobalState";

interface CollectionMarketItem {
  collectionId: string;
  marketId: string;
}

export function useAllCollectionsMarkets() {
  const accessToken = useGlobalState((state) => state.accessToken);
  return useQuery<CollectionMarketItem[]>({
    queryKey: ["useAllCollectionsMarkets"],
    enabled: !isAccessTokenExpired(accessToken),
    queryFn: async () => {
      try {
        const collectionMarkets = await fetchAuth(
          accessToken, 
          `${getAppUrl()}/.netlify/functions/collections-markets`, 
          "GET"
        ).then((data) =>
          data.data.map((x: { collection_id: string; market_id: string }) => ({
            collectionId: x.collection_id?.toString(),
            marketId: x.market_id.toString(),
          }))
        );
        
        const hasDefaultCollection = collectionMarkets.some((item: CollectionMarketItem) => item.collectionId === "default");
        
        if (!hasDefaultCollection) {
          try {
            const defaultMarkets = await fetchAuth(
              accessToken, 
              `${getAppUrl()}/.netlify/functions/collections`, 
              "GET"
            );
            
            if (Array.isArray(defaultMarkets) && defaultMarkets.length > 0) {
              const defaultCollectionMarkets = defaultMarkets.map((marketId: string) => ({
                collectionId: "default",
                marketId: marketId.toString()
              }));
              
              return [...collectionMarkets, ...defaultCollectionMarkets];
            }
          } catch (err) {
            console.error("Error fetching default collection markets:", err);
          }
        }
        
        return collectionMarkets;
      } catch (error) {
        console.error("Error in useAllCollectionsMarkets:", error);
        return [];
      }
    },
  });
}
