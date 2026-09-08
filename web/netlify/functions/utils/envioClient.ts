import type { SupportedChain } from "@seer-pm/sdk";
import { graphQLClient } from "@seer-pm/sdk/subgraph";
import { type Sdk, type SdkFunctionWrapper, getSdk as getSeerSdk } from "@seer-pm/sdk/subgraph/seer";

/** Stay under Envio's ~250 req/min hard limit. */
const ENVIO_MAX_REQUESTS_PER_MINUTE = 200;
const ENVIO_MIN_INTERVAL_MS = Math.ceil(60_000 / ENVIO_MAX_REQUESTS_PER_MINUTE);
const ENVIO_MAX_ATTEMPTS = 6;
const ENVIO_RETRY_BASE_MS = 1_000;
const ENVIO_RETRY_MAX_MS = 30_000;

/** Cap on requests in flight at once, so pacing never turns into a burst against the indexer. */
const ENVIO_MAX_IN_FLIGHT = 8;

let nextSlotMs = 0;
let inFlight = 0;
const waiters: (() => void)[] = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function releaseEnvioSlot(): void {
  // Hand the slot straight to the next waiter instead of decrementing, so the count can never
  // dip and let an extra caller in between the release and the waiter resuming.
  const next = waiters.shift();
  if (next) next();
  else inFlight--;
}

/**
 * Pace Envio HTTP calls under the per-minute budget without serializing them.
 *
 * Reserving the slot is a read-modify-write on `nextSlotMs`, which is atomic on a single-threaded
 * runtime — no promise chain needed. Chaining used to add each request's full latency on top of the
 * interval, so the caller's `Promise.all` fan-out ran strictly one at a time.
 */
async function acquireEnvioSlot(): Promise<void> {
  if (inFlight >= ENVIO_MAX_IN_FLIGHT) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  } else {
    inFlight++;
  }
  const now = Date.now();
  const slot = Math.max(now, nextSlotMs);
  nextSlotMs = slot + ENVIO_MIN_INTERVAL_MS;
  if (slot > now) await sleep(slot - now);
}

function isEnvioRateLimitError(error: unknown): boolean {
  // biome-ignore lint/suspicious/noExplicitAny: graphql-request ClientError shape varies across bundles
  const err = error as any;
  const status = err?.response?.status ?? err?.status;
  if (status === 429) return true;

  const body = err?.response?.body ?? err?.response?.error ?? err?.message ?? "";
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return /"status"\s*:\s*429|rate.?limit|too many requests/i.test(text);
}

function retryDelayMs(attempt: number): number {
  const expo = Math.min(ENVIO_RETRY_MAX_MS, ENVIO_RETRY_BASE_MS * 2 ** (attempt - 1));
  return expo + Math.floor(Math.random() * 250);
}

const envioSdkWrapper: SdkFunctionWrapper = async (action, operationName) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ENVIO_MAX_ATTEMPTS; attempt++) {
    await acquireEnvioSlot();
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isEnvioRateLimitError(error) || attempt === ENVIO_MAX_ATTEMPTS) {
        throw error;
      }
      const delay = retryDelayMs(attempt);
      console.warn("envio: rate limited", { operationName, attempt, delayMs: delay });
      await sleep(delay);
    } finally {
      releaseEnvioSlot();
    }
  }
  throw lastError;
};

const sdkByChain = new Map<number, Sdk>();

/** Seer HyperIndex SDK with shared rate limit + 429 retry. */
export function seerEnvioSdk(chainId: SupportedChain): Sdk {
  const cached = sdkByChain.get(chainId);
  if (cached) return cached;

  const client = graphQLClient(chainId);
  if (!client) {
    throw new Error(`Seer subgraph client unavailable for chain ${chainId}`);
  }
  const sdk = getSeerSdk(client, envioSdkWrapper);
  sdkByChain.set(chainId, sdk);
  return sdk;
}
