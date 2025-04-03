import { getAppUrl } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { id } from "ethers/lib/utils";

export function useGetCollectionById(collectionId: string) {
  return useQuery<{ id: string; name: string; userId: string }>({
    enabled: !!id,
    queryKey: ["useGetCollectionById", collectionId],
    queryFn: async () => {
      return fetch(`${getAppUrl()}/.netlify/functions/collections-handler/${collectionId}`)
        .then((res) => res.json())
        .then(
          (data) =>
            data.data.map((x: { id: number; name: string; user_id: string }) => ({
              ...x,
              id: x.id.toString(),
              userId: x.user_id,
            }))[0],
        );
    },
  });
}
