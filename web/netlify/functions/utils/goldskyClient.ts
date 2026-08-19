import { gnosis } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { swaprGraphQLClient, uniswapGraphQLClient } from "@seer-pm/sdk/subgraph";
import type { SdkFunctionWrapper } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getSwaprSdk } from "@seer-pm/sdk/subgraph/swapr";
import { getSdk as getUniswapSdk } from "@seer-pm/sdk/subgraph/uniswap";
import type { GraphQLClient } from "graphql-request";

/** Goldsky public Algebra endpoint: 50 req / 10s — stay under with margin. */
const GOLDSKY_MAX_REQUESTS_PER_10S = 45;
const GOLDSKY_MIN_INTERVAL_MS = Math.ceil(10_000 / GOLDSKY_MAX_REQUESTS_PER_10S);
const GOLDSKY_MAX_ATTEMPTS = 5;
const GOLDSKY_RETRY_BASE_MS = 1_000;
const GOLDSKY_RETRY_MAX_MS = 15_000;

let nextSlotMs = 0;
let chain: Promise<unknown> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Serialize DEX subgraph HTTP calls and pace them under Goldsky's 50/10s budget. */
async function acquireGoldskySlot(): Promise<void> {
  const run = chain.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, nextSlotMs - now);
    nextSlotMs = Math.max(now, nextSlotMs) + GOLDSKY_MIN_INTERVAL_MS;
    if (waitMs > 0) await sleep(waitMs);
  });
  chain = run.catch(() => {});
  await run;
}

function isGoldskyRetriableError(error: unknown): boolean {
  // biome-ignore lint/suspicious/noExplicitAny: graphql-request ClientError shape varies across bundles
  const err = error as any;
  const status = err?.response?.status ?? err?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;

  const message = err?.message ?? "";
  if (/missing in response|DEX subgraph/i.test(message)) return true;

  const body = err?.response?.body ?? err?.response?.error ?? message;
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return /"status"\s*:\s*429|rate.?limit|too many requests|502|503|504/i.test(text);
}

function retryDelayMs(attempt: number): number {
  const expo = Math.min(GOLDSKY_RETRY_MAX_MS, GOLDSKY_RETRY_BASE_MS * 2 ** (attempt - 1));
  return expo + Math.floor(Math.random() * 250);
}

const goldskySdkWrapper: SdkFunctionWrapper = async (action, operationName) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= GOLDSKY_MAX_ATTEMPTS; attempt++) {
    await acquireGoldskySlot();
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isGoldskyRetriableError(error) || attempt === GOLDSKY_MAX_ATTEMPTS) {
        throw error;
      }
      const delay = retryDelayMs(attempt);
      console.warn("goldsky: retriable DEX subgraph error", { operationName, attempt, delayMs: delay });
      await sleep(delay);
    }
  }
  throw lastError;
};

/** Rate-limited wrapper for raw `GraphQLClient.request` calls (e.g. combine-query batches). */
export async function runGoldskyDexRequest<T>(action: () => Promise<T>, operationName = "manual"): Promise<T> {
  return goldskySdkWrapper(action, operationName);
}

type DexSdk = ReturnType<typeof getSwaprSdk> | ReturnType<typeof getUniswapSdk>;

const dexSdkByChain = new Map<number, DexSdk>();

export function getDexGraphQLClient(chainId: SupportedChain): GraphQLClient {
  const client = chainId === gnosis.id ? swaprGraphQLClient(chainId, "algebra") : uniswapGraphQLClient(chainId);
  if (!client) {
    throw new Error(`Subgraph not available for chain ${chainId}`);
  }
  return client;
}

/** DEX subgraph SDK (Swapr on Gnosis, Uniswap elsewhere) with Goldsky rate limit + retry. */
export function getDexSubgraphSdk(chainId: SupportedChain): DexSdk {
  const cached = dexSdkByChain.get(chainId);
  if (cached) return cached;

  const client = getDexGraphQLClient(chainId);
  const sdk = chainId === gnosis.id ? getSwaprSdk(client, goldskySdkWrapper) : getUniswapSdk(client, goldskySdkWrapper);
  dexSdkByChain.set(chainId, sdk);
  return sdk;
}

/** Swapr algebra-farming SDK (Gnosis incentives) — same Goldsky pacing. */
export function getSwaprAlgebraFarmingSdk(): ReturnType<typeof getSwaprSdk> {
  const key = -1;
  const cached = dexSdkByChain.get(key);
  if (cached) return cached as ReturnType<typeof getSwaprSdk>;

  const client = swaprGraphQLClient(gnosis.id, "algebrafarming");
  if (!client) {
    throw new Error("Swapr algebra-farming subgraph not available");
  }
  const sdk = getSwaprSdk(client, goldskySdkWrapper);
  dexSdkByChain.set(key, sdk);
  return sdk;
}
