import type { NotifierFn, SignInProps, SignInResult } from "@seer-pm/sdk";
import { signIn } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { useConfig } from "wagmi";

export type { SignInResult };

export interface UseSignInOptions {
  /** UI-agnostic notifier (e.g. toast) for signing progress. */
  notifier: NotifierFn;
  /** Called with the sign-in result on success. */
  onSuccess?: (data: SignInResult) => unknown;
}

async function signInWithNotifier(
  props: SignInProps,
  notifier: NotifierFn,
  config: Parameters<typeof signIn>[1],
): Promise<SignInResult> {
  const result = await notifier(() => signIn(props, config), {
    txSent: { title: "Signing in..." },
    txSuccess: { title: "You are now signed in" },
  });
  if (!result.status) throw result.error;
  return result.data;
}

/**
 * Mutation hook to sign in with Ethereum (SIWE) and obtain a Seer access token.
 * Persist the token and handle app-specific side effects in `onSuccess`.
 */
export function useSignIn({ notifier, onSuccess }: UseSignInOptions) {
  const config = useConfig();
  return useMutation({
    mutationFn: (props: SignInProps) => signInWithNotifier(props, notifier, config),
    onSuccess,
  });
}
