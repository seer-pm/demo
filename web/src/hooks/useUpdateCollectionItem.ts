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
  fetchAuth(props.accessToken, "/.netlify/functions/collections", "POST", {
    marketIds: props.marketIds,
    collectionId: props.collectionId,
  });
}

export const useUpdateCollectionItem = (onSuccess?: () => void) => {
  return useMutation({
    mutationKey: ["useUpdateCollectionItem"],
    mutationFn: updateCollectionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useFavorites"] });
      onSuccess?.();
    },
  });
};
