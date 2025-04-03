import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export function useUpdateCollection(onSuccess?: () => void) {
  return useMutation({
    mutationKey: ["useUpdateCollection"],
    mutationFn: ({ accessToken, collectionId, name }: { accessToken: string; collectionId: string; name: string }) =>
      fetchAuth(accessToken, `/.netlify/functions/collections-handler/${collectionId}`, "PATCH", {
        name,
      }),
    onError: (error) => {
      toastError({ title: error.message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["useGetCollections"] });
      onSuccess?.();
    },
  });
}
