import Breadcrumb from "@/components/Breadcrumb";
import { ChainFilterChips } from "@/components/ChainFilterChips";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { TraderScoreBadge, type TraderScoreBreakdown } from "@/components/TraderScoreBadge";
import { TraderScoreLegend } from "@/components/TraderScoreLegend";
import {
  SEER_APPS,
  SEER_APP_ALL_ID,
  type SeerAppFilterId,
  type SeerAppId,
  chainIdsForAppFilter,
  childScopes,
  isGlobalAppFilter,
  listSeerApps,
  marketScopeFilterId,
  marketsForAppFilter,
  parentAppId,
} from "@/lib/apps";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { SIGNED_TONE_CLASS, formatUsd, signedTone } from "@/lib/formatUsd";
import { ArrowDropDown, ArrowDropUp, Filter } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { SCORE_UNAVAILABLE, type ScoreUnavailable } from "@/lib/traderScore";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

type Period = "1d" | "1w" | "1m" | "all";
type SortKey = "pnl" | "volume" | "roi" | "markets" | "score";
type SortDir = "asc" | "desc";

type LeaderboardApiResponse = {
  app: string;
  chainId: number | "all";
  period: Period;
  sort: SortKey;
  dir: SortDir;
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
    /** 0-100; null when the wallet does not clear the score's eligibility gate. */
    score: number | null;
    tier: string | null;
    /** Present only when `score` is null: which eligibility gate the wallet missed, and by how much. */
    scoreUnavailable?: ScoreUnavailable;
    /** Five weighted sub-scores. Requested with `breakdown=1` so the pill can explain its verdict. */
    scoreBreakdown?: TraderScoreBreakdown;
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

const SORT_LABELS: Record<SortKey, string> = {
  pnl: "Profit/Loss",
  volume: "Volume",
  roi: "ROI",
  markets: "Traded Markets",
  score: "Score",
};

const SORT_DIR_LABELS: Record<SortDir, string> = {
  desc: "high to low",
  asc: "low to high",
};

// One null convention across the table: two glyphs for the same "no value" claim in adjacent
// columns read as two different states, and "N/A" is the one that says what it means.
const ROI_UNAVAILABLE = SCORE_UNAVAILABLE;
const ROI_UNAVAILABLE_TITLE = "Not enough capital in this period to compute ROI";

function formatPnlUsd(value: number) {
  return formatUsd(value, { signed: true });
}

function formatVolumeUsd(value: number) {
  return formatUsd(Math.abs(value));
}

function formatRoi(roi: number | null) {
  if (roi == null || !Number.isFinite(roi)) return ROI_UNAVAILABLE;
  const pct = roi * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function sortStatusText(sort: SortKey, dir: SortDir) {
  const ranking = `Sorted by ${SORT_LABELS[sort]}, ${SORT_DIR_LABELS[dir]}`;
  if (sort === "volume" && dir === "asc") {
    return `${ranking}. Wallets with no volume in this period rank first.`;
  }
  if (sort === "markets" && dir === "asc") {
    return `${ranking}. Wallets with no traded markets in this period rank first.`;
  }
  if (sort === "roi") {
    return `${ranking}. ${ROI_UNAVAILABLE} means a wallet had under $0.01 of capital.`;
  }
  if (sort === "score") {
    // Deliberately short: this string sits in an aria-live region and is re-announced on every sort
    // toggle. The formula and the tier bands live in the Score header's legend instead.
    return `${ranking}. ${SCORE_UNAVAILABLE} means the wallet has too little history to score.`;
  }
  return ranking;
}

function appHasMarkets(appId: SeerAppId, chainIds: number[]) {
  return chainIds.some((id) => (marketsForAppFilter(appId, id)?.length ?? 0) > 0);
}

async function fetchPnlLeaderboard(params: {
  app: SeerAppFilterId;
  chainId: ChainFilter;
  period: Period;
  sort: SortKey;
  dir: SortDir;
  search: string;
  limit: number;
  offset: number;
}): Promise<LeaderboardApiResponse> {
  const qs = new URLSearchParams({
    app: params.app,
    chainId: String(params.chainId),
    period: params.period,
    sort: params.sort,
    dir: params.dir,
    limit: String(params.limit),
    offset: String(params.offset),
    // The board renders 25 rows, and the pill's breakdown is what lets a wallet see which of the
    // five components produced its tier. Cheap enough at this page size to always ask for it.
    breakdown: "1",
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
  sort: SortKey;
  dir: SortDir;
  address: string;
}): Promise<RankForResponse> {
  const qs = new URLSearchParams({
    app: params.app,
    chainId: String(params.chainId),
    period: params.period,
    sort: params.sort,
    dir: params.dir,
    rankFor: params.address.toLowerCase(),
  });
  const res = await fetch(`/.netlify/functions/get-pnl-leaderboard?${qs.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<RankForResponse>;
}

function SortMark({ active, dir }: { active: boolean; dir: SortDir }) {
  const Icon = active && dir === "asc" ? ArrowDropUp : ArrowDropDown;
  return (
    <span
      className={clsx(
        "inline-flex size-4 flex-shrink-0 items-center justify-center [&>svg]:size-4",
        active ? "opacity-100" : "opacity-45",
      )}
      aria-hidden
    >
      <Icon fill="currentColor" />
    </span>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  activeDir,
  onSort,
  info,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: SortKey;
  activeDir: SortDir;
  onSort: (key: SortKey) => void;
  /** Rendered beside the label, outside the sort button so opening it does not re-sort the table. */
  info?: ReactNode;
}) {
  const active = activeSort === sortKey;
  const currentDir = active ? (activeDir === "asc" ? "ascending" : "descending") : "not sorted";
  const nextDir = !active || activeDir === "asc" ? "descending" : "ascending";

  return (
    <th
      className="text-right"
      scope="col"
      aria-sort={active ? (activeDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="flex items-center justify-end gap-1">
        <button
          type="button"
          className={clsx(
            "inline-flex items-center justify-end gap-1 min-h-11 font-semibold rounded-[1px] hover:text-base-content",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary",
            info ? "" : "w-full",
            active ? "text-base-content" : "text-black-secondary",
          )}
          onClick={() => onSort(sortKey)}
          aria-label={`${label}, ${currentDir}. Activate to sort ${nextDir}.`}
        >
          {label}
          <SortMark active={active} dir={active ? activeDir : "desc"} />
        </button>
        {info}
      </span>
    </th>
  );
}

function LeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const [app, setApp] = useState<SeerAppFilterId>(SEER_APP_ALL_ID);
  const [chainId, setChainId] = useState<ChainFilter>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<SortKey>("pnl");
  const [dir, setDir] = useState<SortDir>("desc");
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
  const selectedParentAppId = useMemo(() => parentAppId(app), [app]);
  const nestedMarkets = useMemo(
    () => (selectedParentAppId ? childScopes(selectedParentAppId) : []),
    [selectedParentAppId],
  );

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
    const parent = parentAppId(app);
    if (!parent || !appsWithMarkets.some((a) => a.id === parent)) {
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
    queryKey: ["pnl-leaderboard", app, effectiveChainId, period, sort, dir, search, page],
    queryFn: () =>
      fetchPnlLeaderboard({
        app,
        chainId: effectiveChainId,
        period,
        sort,
        dir,
        search,
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: hasMarketsForSelection,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.rows ?? [];
  const isInitialLoad = query.isPending && !query.data;
  const isRefreshing = query.isFetching && !!query.data;

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  const selectedAppLabel = useMemo(() => {
    if (isGlobalAppFilter(app)) return null;
    const parent = parentAppId(app);
    if (!parent) return app;
    const parentLabel = SEER_APPS[parent].label;
    if (app === parent) return parentLabel;
    const market = nestedMarkets.find((m) => marketScopeFilterId(parent, m.id) === app);
    return market ? `${parentLabel} · ${market.label}` : parentLabel;
  }, [app, nestedMarkets]);

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
        sort,
        dir,
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

  const resetPaging = () => {
    setPage(0);
    setHighlightAddress(undefined);
    setRankStatus("idle");
  };

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setDir("desc");
    }
    resetPaging();
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
          markets not assigned to an app). App filters scope to that app&apos;s configured markets; Deepfunding and
          Foresight also offer per-market boards.
        </p>
        <p className="text-black-secondary max-w-2xl">
          <strong className="font-semibold text-base-content">Trader Score</strong> rates each wallet 0–100 on returns,
          profit factor, hit rate, loss burn and breadth across the markets it traded.{" "}
          <a
            className="text-purple-primary hover:underline"
            href={paths.leaderboardGuide()}
            target="_blank"
            rel="noopener noreferrer"
          >
            How it works
          </a>
          .
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
                  resetPaging();
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
              resetPaging();
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
                resetPaging();
              }}
            >
              All
            </button>
            {appsWithMarkets.map((a) => (
              <button
                key={a.id}
                type="button"
                className={clsx(chipClass(selectedParentAppId === a.id), "gap-2")}
                onClick={() => {
                  setApp(a.id);
                  resetPaging();
                }}
              >
                {paths.logoImage(a.logoKey) ? (
                  <img src={paths.logoImage(a.logoKey)} alt="" className="w-4 h-4 rounded-full" />
                ) : null}
                {a.label}
              </button>
            ))}
          </div>

          {selectedParentAppId && nestedMarkets.length > 0 ? (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-black-secondary mr-1">Market</span>
              <button
                type="button"
                className={chipClass(app === selectedParentAppId)}
                onClick={() => {
                  setApp(selectedParentAppId);
                  resetPaging();
                }}
              >
                All
              </button>
              {nestedMarkets.map((market) => {
                const scopeId = marketScopeFilterId(selectedParentAppId, market.id);
                return (
                  <button
                    key={scopeId}
                    type="button"
                    className={chipClass(app === scopeId)}
                    onClick={() => {
                      setApp(scopeId);
                      resetPaging();
                    }}
                  >
                    {market.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <ChainFilterChips
            value={effectiveChainId}
            chains={availableChains.length > 0 ? availableChains : supportedChainIds}
            onChange={(id) => {
              setChainId(id);
              resetPaging();
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
          {query.error && rows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-separator-100">
              <p className="text-sm text-error">{(query.error as Error).message || "Failed to refresh leaderboard"}</p>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => void query.refetch()}>
                Retry
              </button>
            </div>
          ) : null}
          <p id="leaderboard-sort-status" className="text-sm text-black-secondary px-4 pt-3 pb-1" aria-live="polite">
            {sortStatusText(sort, dir)}
            {isRefreshing ? " Updating…" : ""}
          </p>
          <table className="table" aria-busy={query.isFetching} aria-describedby="leaderboard-sort-status">
            <thead>
              <tr>
                <th className="w-16" scope="col">
                  #
                </th>
                <th scope="col">Account</th>
                <SortableHeader
                  label={SORT_LABELS.score}
                  sortKey="score"
                  activeSort={sort}
                  activeDir={dir}
                  onSort={toggleSort}
                  info={<TraderScoreLegend />}
                />
                <SortableHeader
                  label={SORT_LABELS.pnl}
                  sortKey="pnl"
                  activeSort={sort}
                  activeDir={dir}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label={SORT_LABELS.volume}
                  sortKey="volume"
                  activeSort={sort}
                  activeDir={dir}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label={SORT_LABELS.roi}
                  sortKey="roi"
                  activeSort={sort}
                  activeDir={dir}
                  onSort={toggleSort}
                />
                <SortableHeader
                  label={SORT_LABELS.markets}
                  sortKey="markets"
                  activeSort={sort}
                  activeDir={dir}
                  onSort={toggleSort}
                />
              </tr>
            </thead>
            <tbody className={clsx(isRefreshing && "opacity-60")}>
              {isInitialLoad ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-black-secondary">
                    Loading leaderboard…
                  </td>
                </tr>
              ) : query.error && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="space-y-3">
                      <p className="text-error">{(query.error as Error).message || "Failed to load leaderboard"}</p>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => void query.refetch()}>
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-black-secondary">
                    No ranked wallets yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
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
                      <td className="text-right">
                        <TraderScoreBadge
                          score={row.score}
                          tier={row.tier}
                          marketCount={row.marketCount}
                          scoreUnavailable={row.scoreUnavailable}
                          breakdown={row.scoreBreakdown}
                        />
                      </td>
                      <td className={`text-right font-semibold tabular-nums ${SIGNED_TONE_CLASS[signedTone(row.pnl)]}`}>
                        {formatPnlUsd(row.pnl)}
                      </td>
                      <td className="text-right tabular-nums">{formatVolumeUsd(row.volume)}</td>
                      <td
                        className={`text-right font-medium tabular-nums ${
                          row.roi == null ? "text-black-secondary" : SIGNED_TONE_CLASS[signedTone(row.roi)]
                        }`}
                        title={row.roi == null ? ROI_UNAVAILABLE_TITLE : undefined}
                        aria-label={row.roi == null ? `ROI not available. ${ROI_UNAVAILABLE_TITLE}` : undefined}
                      >
                        {formatRoi(row.roi)}
                      </td>
                      <td className="text-right tabular-nums">{row.marketCount}</td>
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
