import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export const useCollectionsSearch = (name: string | undefined) => {
  return useQuery<Address[] | undefined, Error>({
    enabled: !!name,
    queryKey: ["useCollectionsSearch", name],
    queryFn: async () => {
      const data = await fetch(`/.netlify/functions/collections-search?query=${name}`).then((res) => res.json());
      return data.data.map((x: { market_id: string }) => x.market_id);
    },
  });
};
