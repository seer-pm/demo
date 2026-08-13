import Breadcrumb from "@/components/Breadcrumb";
import { ChainFilterChips } from "@/components/ChainFilterChips";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import {
  SEER_APP_ALL_ID,
  type SeerAppFilterId,
  chainIdsForAppFilter,
  isGlobalAppFilter,
  listSeerApps,
  marketsForAppFilter,
} from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { formatUsd } from "@/lib/formatUsd";
import { Filter } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

type Period = "1d" | "1w" | "1m" | "all";

type LeaderboardApiResponse = {
  app: string;
  chainId: number | "all";
  period: Period;
  unit: string;
  updatedAt: string | null;
  total: number;
  limit: number;
  offset: number;
  rows: {
    rank: number;
    address: string;
    pnl: number;
    volume: number;
    roi: number | null;
    unit: string;
    chainId?: number;
    marketCount: number;
    updatedAt: string | null;
  }[];
};

type RankForResponse = {
  address: string;
  rank: number | null;
  total: number;
};

type ChainFilter = number | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  all: "ALL",
};

function formatPnlUsd(value: number) {
  return formatUsd(value, { signed: true });
}

function formatVolumeUsd(value: number) {
  return formatUsd(Math.abs(value));
}

function formatRoi(roi: number | null) {
  if (roi == null || !Number.isFinite(roi)) return "—";
  const pct = roi * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function appHasMarkets(appId: Exclude<SeerAppFilterId, typeof SEER_APP_ALL_ID>, chainIds: number[]) {
  return chainIds.some((id) => (marketsForAppFilter(appId, id)?.length ?? 0) > 0);
}

async function fetchPnlLeaderboard(params: {
  app: SeerAppFilterId;
  chainId: ChainFilter;
  period: Period;
  search: string;
  limit: number;
  offset: number;
}): Promise<LeaderboardApiResponse> {
  const qs = new URLSearchParams({
    app: params.app,
    chainId: String(params.chainId),
    period: params.period,
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.search) qs.set("search", params.search);
  const res = await fetch(`/.netlify/functions/get-pnl-leaderboard?${qs.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<LeaderboardApiResponse>;
}

async function fetchMyRank(params: {
  app: SeerAppFilterId;
  chainId: ChainFilter;
  period: Period;
  address: string;
}): Promise<RankForResponse> {
  const qs = new URLSearchParams({
    app: params.app,
    chainId: String(params.chainId),
    period: params.period,
    rankFor: params.address.toLowerCase(),
  });
  const res = await fetch(`/.netlify/functions/get-pnl-leaderboard?${qs.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<RankForResponse>;
}

function LeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const [app, setApp] = useState<SeerAppFilterId>(SEER_APP_ALL_ID);
  const [chainId, setChainId] = useState<ChainFilter>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [highlightAddress, setHighlightAddress] = useState<string | undefined>();
  const [rankStatus, setRankStatus] = useState<"idle" | "loading" | "missing" | "error">("idle");
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  const pageSize = 25;

  const supportedChainIds = useMemo(() => Object.values(SUPPORTED_CHAINS).map((c) => c.id), []);
  const availableChains = useMemo(() => chainIdsForAppFilter(app, supportedChainIds), [app, supportedChainIds]);

  // Keep chain selection valid when app filter changes.
  const effectiveChainId: ChainFilter = useMemo(() => {
    if (chainId === "all") return "all";
    if (availableChains.length === 0) return chainId;
    if (availableChains.includes(chainId)) return chainId;
    return availableChains[0] ?? "all";
  }, [app, availableChains, chainId]);

  const appsWithMarkets = useMemo(() => {
    const chainScope = effectiveChainId === "all" ? supportedChainIds : [effectiveChainId];
    return listSeerApps().filter((a) => appHasMarkets(a.id, chainScope));
  }, [effectiveChainId, supportedChainIds]);

  // Drop a selected app that has no markets for the current chain scope.
  useEffect(() => {
    if (isGlobalAppFilter(app)) return;
    if (!appsWithMarkets.some((a) => a.id === app)) {
      setApp(SEER_APP_ALL_ID);
      setPage(0);
    }
  }, [app, appsWithMarkets]);

  const hasMarketsForSelection = useMemo(() => {
    if (isGlobalAppFilter(app)) return true;
    if (effectiveChainId === "all") {
      return availableChains.some((id) => (marketsForAppFilter(app, id)?.length ?? 0) > 0);
    }
    return (marketsForAppFilter(app, effectiveChainId)?.length ?? 0) > 0;
  }, [app, availableChains, effectiveChainId]);

  const query = useQuery({
    queryKey: ["pnl-leaderboard", app, effectiveChainId, period, search, page],
    queryFn: () =>
      fetchPnlLeaderboard({
        app,
        chainId: effectiveChainId,
        period,
        search,
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: hasMarketsForSelection,
    staleTime: 60_000,
  });

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  const selectedAppLabel = useMemo(() => {
    if (isGlobalAppFilter(app)) return null;
    return listSeerApps().find((a) => a.id === app)?.label ?? app;
  }, [app]);

  const selectedChainLabel = useMemo(() => {
    if (effectiveChainId === "all") return null;
    return SUPPORTED_CHAINS[effectiveChainId as keyof typeof SUPPORTED_CHAINS]?.name ?? String(effectiveChainId);
  }, [effectiveChainId]);

  const filtersActive = !isGlobalAppFilter(app) || effectiveChainId !== "all";
  const filtersSummary = ["Filters", selectedAppLabel, selectedChainLabel].filter(Boolean).join(" · ");

  useEffect(() => {
    if (!highlightAddress) return;
    const frame = requestAnimationFrame(() => {
      highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [highlightAddress, page, query.data?.rows]);

  const jumpToMyRank = async () => {
    if (!connectedAddress) return;
    setRankStatus("loading");
    try {
      const result = await fetchMyRank({
        app,
        chainId: effectiveChainId,
        period,
        address: connectedAddress,
      });
      if (result.rank == null) {
        setRankStatus("missing");
        setHighlightAddress(undefined);
        return;
      }
      setSearch("");
      setSearchInput("");
      setPage(Math.floor((result.rank - 1) / pageSize));
      setHighlightAddress(connectedAddress.toLowerCase());
      setRankStatus("idle");
    } catch {
      setRankStatus("error");
    }
  };

  const chipClass = (active: boolean) =>
    clsx("btn btn-sm", active ? "btn-primary" : "btn-ghost border border-separator-100");

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[32px]">
      <Breadcrumb links={[{ title: "Leaderboard" }]} />

      <div className="space-y-2">
        <h1 className="text-[28px] lg:text-[36px] font-semibold text-base-content">Profit &amp; Loss Leaderboard</h1>
        <p className="text-black-secondary max-w-2xl">
          Rankings of wallets by trading P/L in USD. <strong>All</strong> covers every Seer market on a chain (including
          markets not assigned to an app). App filters scope to that app&apos;s configured markets.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <fieldset className="join">
            <legend className="sr-only">Time period</legend>
            {(["1d", "1w", "1m", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={clsx("btn btn-sm join-item", period === p ? "btn-primary" : "btn-ghost")}
                onClick={() => {
                  setPeriod(p);
                  setPage(0);
                  setHighlightAddress(undefined);
                  setRankStatus("idle");
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </fieldset>

          <button
            type="button"
            className={clsx("btn btn-sm gap-2 border border-separator-100", filtersOpen ? "btn-primary" : "btn-ghost")}
            aria-expanded={filtersOpen}
            aria-controls="leaderboard-filters-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Filter />
            {filtersSummary}
            {filtersActive && !filtersOpen ? (
              <span className="w-2 h-2 rounded-full bg-error-primary" aria-hidden />
            ) : null}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {connectedAddress ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={rankStatus === "loading" || !hasMarketsForSelection}
              onClick={() => void jumpToMyRank()}
            >
              {rankStatus === "loading" ? "Finding your rank…" : "Your Rank"}
            </button>
          ) : null}

          <form
            className="flex gap-2 grow sm:grow-0"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPage(0);
              setHighlightAddress(undefined);
              setRankStatus("idle");
            }}
          >
            <input
              type="search"
              className="input input-bordered input-sm w-full sm:w-72"
              placeholder="Search by address"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Search
            </button>
            {search ? (
              <button
                type="button"
                className="btn btn-sm btn-ghost border border-separator-100"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(0);
                }}
              >
                Clear
              </button>
            ) : null}
          </form>
        </div>
      </div>

      {rankStatus === "missing" ? (
        <p className="text-sm text-black-secondary">
          Your connected wallet is not on this leaderboard for the current filters.
        </p>
      ) : null}
      {rankStatus === "error" ? <p className="text-sm text-error">Could not look up your rank. Try again.</p> : null}

      {filtersOpen ? (
        <div
          id="leaderboard-filters-panel"
          className="bg-base-100 border border-separator-100 rounded-[1px] p-4 space-y-4"
        >
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-black-secondary mr-1">App</span>
            <button
              type="button"
              className={chipClass(app === SEER_APP_ALL_ID)}
              onClick={() => {
                setApp(SEER_APP_ALL_ID);
                setPage(0);
                setHighlightAddress(undefined);
                setRankStatus("idle");
              }}
            >
              All
            </button>
            {appsWithMarkets.map((a) => (
              <button
                key={a.id}
                type="button"
                className={clsx(chipClass(app === a.id), "gap-2")}
                onClick={() => {
                  setApp(a.id);
                  setPage(0);
                  setHighlightAddress(undefined);
                  setRankStatus("idle");
                }}
              >
                {paths.logoImage(a.logoKey) ? (
                  <img src={paths.logoImage(a.logoKey)} alt="" className="w-4 h-4 rounded-full" />
                ) : null}
                {a.label}
              </button>
            ))}
          </div>

          <ChainFilterChips
            value={effectiveChainId}
            chains={availableChains.length > 0 ? availableChains : supportedChainIds}
            onChange={(id) => {
              setChainId(id);
              setPage(0);
              setHighlightAddress(undefined);
              setRankStatus("idle");
            }}
          />
        </div>
      ) : null}

      {!hasMarketsForSelection ? (
        <div className="bg-base-100 border border-separator-100 rounded-[1px] p-6 text-black-secondary">
          No markets are available for this app
          {effectiveChainId === "all" ? "" : " on this chain"} yet. Try another app or chain filter.
        </div>
      ) : (
        <div className="bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-16">#</th>
                <th>Account</th>
                <th className="text-right">Profit/Loss</th>
                <th className="text-right">Volume</th>
                <th className="text-right">ROI</th>
                <th className="text-right">Traded Markets</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-black-secondary">
                    Loading leaderboard…
                  </td>
                </tr>
              ) : query.error ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="space-y-3">
                      <p className="text-error">{(query.error as Error).message || "Failed to load leaderboard"}</p>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => void query.refetch()}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (query.data?.rows.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-black-secondary">
                    No ranked wallets yet.
                  </td>
                </tr>
              ) : (
                query.data!.rows.map((row) => {
                  const positive = row.pnl >= 0;
                  const roiPositive = row.roi != null && row.roi >= 0;
                  const rowAddress = row.address.toLowerCase();
                  const connectedLc = connectedAddress?.toLowerCase();
                  const highlightLc = highlightAddress?.toLowerCase();
                  const isMe = !!connectedLc && !!highlightLc && rowAddress === highlightLc;
                  const isConnectedRow = !!connectedLc && rowAddress === connectedLc;
                  const emphasize = isMe || (isConnectedRow && !highlightAddress);
                  return (
                    <tr
                      key={row.address}
                      ref={isMe ? highlightedRowRef : undefined}
                      className={clsx(emphasize && "bg-purple-primary/10")}
                    >
                      <td className="font-medium">{row.rank}</td>
                      <td>
                        <a className="text-sm hover:text-purple-primary" href={`/portfolio/${row.address}`}>
                          <AddressOrName address={row.address as Address} />
                          {isConnectedRow ? (
                            <span className="ml-2 text-xs text-purple-primary font-medium">You</span>
                          ) : null}
                        </a>
                      </td>
                      <td className={`text-right font-semibold ${positive ? "text-[#00C42B]" : "text-[#c40000]"}`}>
                        {formatPnlUsd(row.pnl)}
                      </td>
                      <td className="text-right">{formatVolumeUsd(row.volume)}</td>
                      <td
                        className={`text-right font-medium ${
                          row.roi == null ? "text-black-secondary" : roiPositive ? "text-[#00C42B]" : "text-[#c40000]"
                        }`}
                      >
                        {formatRoi(row.roi)}
                      </td>
                      <td className="text-right">{row.marketCount}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {(query.data?.total ?? 0) > pageSize ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-separator-100">
              <p className="text-sm text-black-secondary">
                Page {page + 1} of {totalPages}
                {query.data?.updatedAt ? ` · Updated ${new Date(query.data.updatedAt).toLocaleString()}` : ""}
              </p>
              <div className="join">
                <button
                  type="button"
                  className="btn btn-sm join-item"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="btn btn-sm join-item"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ) : query.data?.updatedAt ? (
            <p className="text-sm text-black-secondary px-4 py-3 border-t border-separator-100">
              Updated {new Date(query.data.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
