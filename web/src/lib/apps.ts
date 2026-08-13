import type { Address } from "viem";
import { gnosis, optimism } from "viem/chains";

export type SeerAppId = "foresight" | "opportunity" | "deepfund" | "futarchy";

/** Keys accepted by `paths.logoImage`. */
export type SeerAppLogoKey = "foresight" | "opportunity-markets" | "deepfund" | "futarchy";

export type SeerApp = {
  id: SeerAppId;
  label: string;
  logoKey: SeerAppLogoKey;
  /** Market ids keyed by chainId. */
  markets: Partial<Record<number, `0x${string}`[]>>;
};

/**
 * Static registry of apps built on Seer and the markets that belong to each.
 * Fill `markets` with real chain → market id lists as they are known.
 */
export const SEER_APPS: Record<SeerAppId, SeerApp> = {
  foresight: {
    id: "foresight",
    label: "Foresight",
    logoKey: "foresight",
    markets: {
      [gnosis.id]: [
        "0x6f7ae2815e7e13c14a6560f4b382ae78e7b1493e",
        "0x6b182ffe23a9df5f5bfb2e9b6b4ce5716e84ab1f",
        "0xb3027df942259e82c40b620daa4fd9f3541bcd4f",
      ],
    },
  },
  opportunity: {
    id: "opportunity",
    label: "Opportunity Markets",
    logoKey: "opportunity-markets",
    markets: {
      [gnosis.id]: ["0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a", "0xc2b8e25675db9977ad14bca62b655e4aa6b36683"],
    },
  },
  deepfund: {
    id: "deepfund",
    label: "Deepfunding",
    logoKey: "deepfund",
    markets: {
      [optimism.id]: [
        // round2-l1
        "0x3220a208aaf4d2ceecde5a2e21ec0c9145f40ba6",
        // round2-l2
        "0x2d05454c1b4387b5d8be84bee20d58390a01ca64",
        // round2
        "0xdb3aae8d1c964767eeaa17805be25cded7a17210",
        // round1
        "0xb88275fe4e2494e04cea8fb5e9d913aa48add581",
        // octant
        "0xe85ada7cd6d33cb41ac596fb4749e3f94d836ece",
      ],
    },
  },
  futarchy: {
    id: "futarchy",
    label: "Futarchy.fi",
    logoKey: "futarchy",
    markets: {},
  },
};

export const SEER_APP_IDS = Object.keys(SEER_APPS) as SeerAppId[];

/** Synthetic id for the protocol-wide leaderboard (every market on each chain, including those not in any app). */
export const SEER_APP_ALL_ID = "all" as const;

export type SeerAppFilterId = SeerAppId | typeof SEER_APP_ALL_ID;

export function isSeerAppId(value: string): value is SeerAppId {
  return Object.prototype.hasOwnProperty.call(SEER_APPS, value);
}

export function isSeerAppFilterId(value: string): value is SeerAppFilterId {
  return value === SEER_APP_ALL_ID || isSeerAppId(value);
}

export function isGlobalAppFilter(app: SeerAppFilterId): boolean {
  return app === SEER_APP_ALL_ID;
}

export function listSeerApps(): SeerApp[] {
  return SEER_APP_IDS.map((id) => SEER_APPS[id]);
}

function normalizeMarketIds(ids: readonly `0x${string}`[]): Address[] {
  return ids.map((id) => id.toLowerCase() as Address);
}

function appChainIds(app: SeerApp): number[] {
  return Object.keys(app.markets)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Chain ids for the UI filter.
 * `all` is protocol-wide — callers should pass supported chain ids (not only app-configured ones).
 */
export function chainIdsForAppFilter(app: SeerAppFilterId, supportedChainIds?: number[]): number[] {
  if (app === SEER_APP_ALL_ID) {
    return [...(supportedChainIds ?? [])].sort((a, b) => a - b);
  }
  return appChainIds(SEER_APPS[app]);
}

/**
 * Markets for an app filter on a chain.
 * For `all`, returns `null` meaning “no market allowlist / entire protocol”.
 */
export function marketsForAppFilter(app: SeerAppFilterId, chainId: number): Address[] | null {
  if (app === SEER_APP_ALL_ID) {
    return null;
  }
  return normalizeMarketIds(SEER_APPS[app].markets[chainId] ?? []);
}
