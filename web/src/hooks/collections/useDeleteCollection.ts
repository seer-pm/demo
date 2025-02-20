import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export function useDeleteCollection(onSuccess?: () => void) {
  return useMutation({
    mutationKey: ["useDeleteCollection"],
    mutationFn: ({ accessToken, collectionId }: { accessToken: string; collectionId: string }) =>
      fetchAuth(accessToken, `/.netlify/functions/collections-handler/${collectionId}`, "DELETE"),
    onError: (error) => {
      toastError({ title: error.message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useGetCollections"] });
      onSuccess?.();
    },
  });
}
