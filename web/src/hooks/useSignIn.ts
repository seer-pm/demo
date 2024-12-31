import { queryClient } from "@/lib/query-client";
import { toastify } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { signMessage } from "@wagmi/core";
import { Address } from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { useAccount } from "wagmi";
import { useGlobalState } from "./useGlobalState";
import { updateCollectionItem } from "./useUpdateCollectionItem";

export const createMessage = (address: `0x${string}`, nonce: string, chainId: number, statement?: string) => {
  const domain = window.location.host;
  const origin = window.location.origin;

  // signature is valid only for 10 mins
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

  const message = createSiweMessage({
    domain,
    address,
    statement: statement ?? "Sign In to Seer with Ethereum.",
    uri: origin,
    version: "1",
    chainId,
    nonce,
    expirationTime,
  });
  return message;
};

interface SignInProps {
  address: Address;
  chainId: number;
  statement?: string;
}

export interface SignInResult {
  token: string;
  user: {
    id: Address;
    email: string;
  };
}

async function signIn(props: SignInProps): Promise<SignInResult> {
  const result = await toastify(
    async () => {
      const message = createMessage(props.address, generateSiweNonce(), props.chainId, props.statement);
      const signature = await signMessage(config, { message });

      const tokenRes = await fetch("/.netlify/functions/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Failed to sign in: ${tokenRes.statusText}`);
      }
      return await tokenRes.json();
    },
    {
      txSent: { title: "Signing in..." },
      txSuccess: { title: "You are now signed in" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.data;
}

export const useSignIn = (onSuccess?: (data: SignInResult) => unknown) => {
  const { address } = useAccount();
  const [favorites, setAccessToken] = useGlobalState((state) => [state.favoritesDeprecated, state.setAccessToken]);
  return useMutation({
    mutationFn: signIn,
    onSuccess: (data: SignInResult) => {
      setAccessToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["useFavorites"] });

      if (address && (favorites[address] || []).length > 0) {
        // TODO: clear local storage data
        updateCollectionItem({ marketIds: favorites[address], accessToken: data.token });
      }

      onSuccess?.(data);
    },
  });
};
