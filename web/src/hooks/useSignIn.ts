import { queryClient } from "@/lib/query-client";
import { toastify } from "@/lib/toastify";
import { type SignInResult, useSignIn as useSignInBase } from "@seer-pm/react";
import { useGlobalState } from "./useGlobalState";

export type { SignInResult };

export const useSignIn = (onSuccess?: (data: SignInResult) => unknown) => {
  const setAccessToken = useGlobalState((state) => state.setAccessToken);
  return useSignInBase({
    notifier: toastify,
    onSuccess: async (data: SignInResult) => {
      setAccessToken(data.token);

      queryClient.invalidateQueries({ queryKey: ["useFavorites"] });
      onSuccess?.(data);
    },
  });
};
