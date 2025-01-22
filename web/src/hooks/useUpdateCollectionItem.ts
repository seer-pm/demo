import { queryClient } from "@/lib/query-client";
import { fetchAuth } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Address } from "viem";

interface UpdateCollectionItemProps {
  accessToken: string;
  marketIds: Address[];
  collectionId?: string;
}

export async function updateCollectionItem(props: UpdateCollectionItemProps): Promise<void> {
  await fetchAuth(props.accessToken, "/.netlify/functions/collections", "POST", {
    marketIds: props.marketIds,
    collectionId: props.collectionId,
  });
}

export const useUpdateCollectionItem = (onSuccess?: () => void) => {
  return useMutation({
    mutationKey: ["useUpdateCollectionItem"],
    mutationFn: updateCollectionItem,
    onMutate: async (newProps) => {
      await queryClient.cancelQueries({ queryKey: ["useFavorites"] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData(["useFavorites"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["useFavorites"], (old: Address[]) => {
        const marketId = newProps.marketIds[0];
        if (old.includes(marketId)) {
          return old.filter((x) => x !== marketId);
        }
        return [...old, marketId];
      });
      // Return a context object with the snapshotted value
      return { previousFavorites };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, _newProps, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["useFavorites"], context?.previousFavorites);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["useFavorites"] });
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });
};
