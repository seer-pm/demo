import type { Config } from "@wagmi/core";
import { signMessage } from "@wagmi/core";
import type { Address } from "viem";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import { getApiHost } from "./subgraph/app-subgraph";

const DEFAULT_STATEMENT = "Sign In to Seer with Ethereum.";
const SIWE_EXPIRATION_MS = 10 * 60 * 1000;

export interface SignInProps {
  address: Address;
  chainId: number;
  statement?: string;
  /** SIWE domain; defaults to `window.location.host`. */
  domain?: string;
  /** SIWE uri; defaults to `window.location.origin`. */
  uri?: string;
  /** Override; default `${getApiHost()}/.netlify/functions/sign-in`. */
  endpoint?: string;
}

export interface SignInResult {
  token: string;
  user: {
    id: Address;
    email?: string;
  };
}

function resolveDomain(domain?: string): string {
  if (domain) return domain;
  if (typeof window !== "undefined") return window.location.host;
  throw new Error("domain is required when window is not available");
}

function resolveUri(uri?: string): string {
  if (uri) return uri;
  if (typeof window !== "undefined") return window.location.origin;
  throw new Error("uri is required when window is not available");
}

export function createSiweSignInMessage(
  address: Address,
  nonce: string,
  chainId: number,
  options?: {
    statement?: string;
    domain?: string;
    uri?: string;
  },
): string {
  return createSiweMessage({
    domain: resolveDomain(options?.domain),
    address,
    statement: options?.statement ?? DEFAULT_STATEMENT,
    uri: resolveUri(options?.uri),
    version: "1",
    chainId,
    nonce,
    expirationTime: new Date(Date.now() + SIWE_EXPIRATION_MS),
  });
}

/**
 * Sign a SIWE message and exchange it for a Seer access token.
 */
export async function signIn(props: SignInProps, config: Config): Promise<SignInResult> {
  const message = createSiweSignInMessage(props.address, generateSiweNonce(), props.chainId, {
    statement: props.statement,
    domain: props.domain,
    uri: props.uri,
  });
  const signature = await signMessage(config, { message });

  const endpoint = props.endpoint ?? `${getApiHost()}/.netlify/functions/sign-in`;
  const tokenRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, signature }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    throw new Error(`Failed to sign in (${tokenRes.status}): ${detail || tokenRes.statusText}`);
  }

  return (await tokenRes.json()) as SignInResult;
}
