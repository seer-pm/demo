import { queryClient } from "@/lib/query-client";
import { toastError } from "@/lib/toastify";
import { fetchAuth } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export function useCreateCollection(onSuccess?: () => void) {
  return useMutation({
    mutationKey: ["useCreateCollection"],
    mutationFn: ({ accessToken, name }: { accessToken: string; name: string }) =>
      fetchAuth(accessToken, "/.netlify/functions/collections-handler", "POST", {
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
