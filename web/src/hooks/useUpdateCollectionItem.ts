import { queryClient } from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { Address } from "viem";

interface UpdateCollectionItemProps {
  accessToken: string;
  marketIds: Address[];
  collectionId?: string;
}

export async function updateCollectionItem(props: UpdateCollectionItemProps): Promise<void> {
  const response = await fetch("/.netlify/functions/collections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${props.accessToken}`,
    },
    body: JSON.stringify({ marketIds: props.marketIds, collectionId: props.collectionId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update collection: ${response.statusText}`);
  }
  return await response.json();
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
