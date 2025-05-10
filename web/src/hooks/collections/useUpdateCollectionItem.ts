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
    mutationKey: ["useAllCollectionsMarkets"],
    mutationFn: updateCollectionItem,
    onMutate: async (newProps) => {
      await queryClient.cancelQueries({ queryKey: ["useAllCollectionsMarkets"] });

      // Snapshot the previous value
      const previousCollectionMarkets = queryClient.getQueryData(["useAllCollectionsMarkets"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["useAllCollectionsMarkets"], (old: { collectionId: string; marketId: string }[] | undefined) => {
        // Ensure old is an array, even if it's undefined
        const safeOld = old || [];
        const marketId = newProps.marketIds[0];
        
        if (
          safeOld
            .filter((x) => (!x.collectionId ? !newProps.collectionId : x.collectionId === newProps.collectionId))
            .map((x) => x.marketId)
            .includes(marketId)
        ) {
          return safeOld.filter((x) => {
            const isCurrentCollection = !x.collectionId
              ? !newProps.collectionId
              : x.collectionId === newProps.collectionId;
            return (isCurrentCollection && x.marketId !== marketId) || !isCurrentCollection;
          });
        }
        return [...safeOld, { marketId, collectionId: newProps.collectionId }];
      });
      
      // Return a context object with the snapshotted value
      return { previousCollectionMarkets };
    },
    // If the mutation fails,
    // use the context returned from onMutate to roll back
    onError: (_err, _newProps, context) => {
      if (context?.previousCollectionMarkets) {
        queryClient.setQueryData(["useAllCollectionsMarkets"], context?.previousCollectionMarkets);
      }
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["useAllCollectionsMarkets"] });
      queryClient.invalidateQueries({ queryKey: ["useCollectionMarkets"] });
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });
};
