import type { Address } from "viem";
import { gnosis, optimism } from "viem/chains";

export type SeerAppId = "foresight" | "opportunity" | "deepfund" | "futarchy";

/** Keys accepted by `paths.logoImage`. */
export type SeerAppLogoKey = "foresight" | "opportunity-markets" | "deepfund" | "futarchy";

/** One parent market (session) belonging to an app; children are expanded at refresh. */
export type SeerAppMarket = {
  /** Stable slug; materialized as `${appId}:${id}` when `splitLeaderboard` is set. */
  id: string;
  /** Chip / UI label. */
  label: string;
  chainId: number;
  marketId: `0x${string}`;
};

export type SeerApp = {
  id: SeerAppId;
  label: string;
  logoKey: SeerAppLogoKey;
  /**
   * When true, refresh materializes one board per market (`app_id = app:market`),
   * and the app board is the sum of those boards at read time.
   * When false/undefined, one job writes `app_id = app` over the union of markets.
   */
  splitLeaderboard?: boolean;
  markets: SeerAppMarket[];
};

/**
 * Static registry of apps built on Seer and the markets that belong to each.
 */
export const SEER_APPS: Record<SeerAppId, SeerApp> = {
  foresight: {
    id: "foresight",
    label: "Foresight",
    logoKey: "foresight",
    splitLeaderboard: true,
    markets: [
      {
        id: "movies-1",
        label: "Movies Experiment 1",
        chainId: gnosis.id,
        marketId: "0x6f7ae2815e7e13c14a6560f4b382ae78e7b1493e",
      },
      {
        id: "movies-2",
        label: "Movies Experiment 2",
        chainId: gnosis.id,
        marketId: "0x6b182ffe23a9df5f5bfb2e9b6b4ce5716e84ab1f",
      },
      {
        id: "movies-3",
        label: "Movies Experiment 3",
        chainId: gnosis.id,
        marketId: "0xacc15cfa0f4ae4932b12ab14595941285098436a",
      },
    ],
  },
  opportunity: {
    id: "opportunity",
    label: "Opportunity Markets",
    logoKey: "opportunity-markets",
    markets: [
      {
        id: "rebrand",
        label: "Rebrand Contest",
        chainId: gnosis.id,
        marketId: "0xe7850b0d928aa40ab8732bd323fa4f6ef3c24b8a",
      },
      {
        id: "devcon-merch",
        label: "Devcon Merch",
        chainId: gnosis.id,
        marketId: "0xc2b8e25675db9977ad14bca62b655e4aa6b36683",
      },
    ],
  },
  deepfund: {
    id: "deepfund",
    label: "Deepfunding",
    logoKey: "deepfund",
    splitLeaderboard: true,
    markets: [
      {
        id: "round2-l1",
        label: "Round 2 · L1",
        chainId: optimism.id,
        marketId: "0x3220a208aaf4d2ceecde5a2e21ec0c9145f40ba6",
      },
      {
        id: "round2-l2",
        label: "Round 2 · L2",
        chainId: optimism.id,
        marketId: "0x2d05454c1b4387b5d8be84bee20d58390a01ca64",
      },
      {
        id: "round2",
        label: "Round 2 · Originality",
        chainId: optimism.id,
        marketId: "0xdb3aae8d1c964767eeaa17805be25cded7a17210",
      },
      {
        id: "round1",
        label: "Round 1",
        chainId: optimism.id,
        marketId: "0xb88275fe4e2494e04cea8fb5e9d913aa48add581",
      },
      {
        id: "octant",
        label: "Octant",
        chainId: optimism.id,
        marketId: "0xe85ada7cd6d33cb41ac596fb4749e3f94d836ece",
      },
    ],
  },
  futarchy: {
    id: "futarchy",
    label: "Futarchy.fi",
    logoKey: "futarchy",
    markets: [],
  },
};

export const SEER_APP_IDS = Object.keys(SEER_APPS) as SeerAppId[];

/** Synthetic id for the protocol-wide leaderboard (every market on each chain, including those not in any app). */
export const SEER_APP_ALL_ID = "all" as const;

/** `all` | app id | `${appId}:${market.id}` (market scopes only for apps with `splitLeaderboard`). */
export type SeerAppFilterId = typeof SEER_APP_ALL_ID | SeerAppId | `${SeerAppId}:${string}`;

export type ParsedAppFilter =
  | { kind: "all" }
  | { kind: "app"; appId: SeerAppId; app: SeerApp }
  | { kind: "market"; appId: SeerAppId; app: SeerApp; market: SeerAppMarket };

export function isSeerAppId(value: string): value is SeerAppId {
  return Object.prototype.hasOwnProperty.call(SEER_APPS, value);
}

export function marketScopeFilterId(appId: SeerAppId, marketSlug: string): SeerAppFilterId {
  return `${appId}:${marketSlug}`;
}

export function parseAppFilter(value: string): ParsedAppFilter | null {
  const normalized = value.toLowerCase();
  if (normalized === SEER_APP_ALL_ID) return { kind: "all" };

  const colon = normalized.indexOf(":");
  if (colon < 0) {
    if (!isSeerAppId(normalized)) return null;
    return { kind: "app", appId: normalized, app: SEER_APPS[normalized] };
  }

  const appId = normalized.slice(0, colon);
  const marketSlug = normalized.slice(colon + 1);
  if (!isSeerAppId(appId) || !marketSlug) return null;
  const app = SEER_APPS[appId];
  if (!app.splitLeaderboard) return null;
  const market = app.markets.find((m) => m.id === marketSlug);
  if (!market) return null;
  return { kind: "market", appId, app, market };
}

export function isSeerAppFilterId(value: string): value is SeerAppFilterId {
  return parseAppFilter(value) != null;
}

export function isGlobalAppFilter(app: SeerAppFilterId): boolean {
  return app === SEER_APP_ALL_ID;
}

/** Parent app id for highlighting / nested chips; `null` for protocol-wide. */
export function parentAppId(filter: SeerAppFilterId): SeerAppId | null {
  const parsed = parseAppFilter(filter);
  if (!parsed || parsed.kind === "all") return null;
  return parsed.appId;
}

export function listSeerApps(): SeerApp[] {
  return SEER_APP_IDS.map((id) => SEER_APPS[id]);
}

/** Markets shown as nested leaderboard chips when the app splits boards. */
export function childScopes(appId: SeerAppId): SeerAppMarket[] {
  const app = SEER_APPS[appId];
  if (!app.splitLeaderboard) return [];
  return app.markets;
}

function normalizeMarketId(id: `0x${string}`): Address {
  return id.toLowerCase() as Address;
}

function uniqueSortedChainIds(markets: readonly SeerAppMarket[]): number[] {
  return [...new Set(markets.map((m) => m.chainId))].sort((a, b) => a - b);
}

/**
 * Chain ids for the UI filter.
 * `all` is protocol-wide — callers should pass supported chain ids (not only app-configured ones).
 */
export function chainIdsForAppFilter(app: SeerAppFilterId, supportedChainIds?: number[]): number[] {
  const parsed = parseAppFilter(app);
  if (!parsed || parsed.kind === "all") {
    return [...(supportedChainIds ?? [])].sort((a, b) => a - b);
  }
  if (parsed.kind === "market") {
    return [parsed.market.chainId];
  }
  return uniqueSortedChainIds(parsed.app.markets);
}

/**
 * Root market ids for a filter on a chain.
 * For `all`, returns `null` meaning “no market allowlist / entire protocol”.
 */
export function marketsForAppFilter(app: SeerAppFilterId, chainId: number): Address[] | null {
  const parsed = parseAppFilter(app);
  if (!parsed || parsed.kind === "all") return null;
  if (parsed.kind === "market") {
    return parsed.market.chainId === chainId ? [normalizeMarketId(parsed.market.marketId)] : [];
  }
  return parsed.app.markets.filter((m) => m.chainId === chainId).map((m) => normalizeMarketId(m.marketId));
}

/**
 * `app_id` values stored in `pnl_leaderboard` that back a public filter.
 * Split apps aggregate by loading every market scope id (no materialized app-level row).
 */
export function materializedAppIdsForFilter(filter: SeerAppFilterId): string[] {
  const parsed = parseAppFilter(filter);
  if (!parsed) return [];
  if (parsed.kind === "all") return [SEER_APP_ALL_ID];
  if (parsed.kind === "market") return [marketScopeFilterId(parsed.appId, parsed.market.id)];
  if (parsed.app.splitLeaderboard) {
    return parsed.app.markets.map((m) => marketScopeFilterId(parsed.appId, m.id));
  }
  return [parsed.appId];
}

export type LeaderboardRefreshJobSpec = {
  /** Materialized `pnl_leaderboard.app_id`. */
  appId: string;
  chainId: number;
  /** Root market ids (children expanded at refresh). Empty apps are skipped by callers. */
  marketIds: Address[];
};

/**
 * App-scoped refresh jobs from the registry.
 * Split apps emit one job per market; others emit one job per chain with the union of roots.
 * Protocol-wide `all` jobs are added by the refresh orchestrator.
 */
export function leaderboardJobsFromApps(): LeaderboardRefreshJobSpec[] {
  const jobs: LeaderboardRefreshJobSpec[] = [];

  for (const app of listSeerApps()) {
    if (app.markets.length === 0) continue;

    if (app.splitLeaderboard) {
      for (const market of app.markets) {
        jobs.push({
          appId: marketScopeFilterId(app.id, market.id),
          chainId: market.chainId,
          marketIds: [normalizeMarketId(market.marketId)],
        });
      }
      continue;
    }

    const byChain = new Map<number, Address[]>();
    for (const market of app.markets) {
      const list = byChain.get(market.chainId) ?? [];
      list.push(normalizeMarketId(market.marketId));
      byChain.set(market.chainId, list);
    }
    for (const [chainId, marketIds] of byChain) {
      jobs.push({ appId: app.id, chainId, marketIds });
    }
  }

  return jobs;
}
