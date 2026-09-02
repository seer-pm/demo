import Breadcrumb from "@/components/Breadcrumb";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { LeaderboardTabs } from "@/components/Leaderboard/LeaderboardTabs";
import { PeriodFilter } from "@/components/Leaderboard/PeriodFilter";
import { type SortDir, SortableHeader } from "@/components/Leaderboard/SortableHeader";
import {
  type AirdropSortKey,
  airdropLeaderboardCsvUrl,
  fetchAirdropRank,
  useAirdropLeaderboard,
} from "@/hooks/airdrop/useAirdropLeaderboard";
import { formatPct, formatSeer } from "@/lib/airdropFormat";
import { ExportIcon } from "@/lib/icons";
import type { LeaderboardPeriod } from "@/lib/leaderboardPeriods";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const SORT_LABELS: Record<AirdropSortKey, string> = {
  seer: "Total",
  holdings: "Holdings",
  poh: "Proof of Humanity",
  days: "Days",
};

const SORT_DIR_LABELS: Record<SortDir, string> = {
  desc: "high to low",
  asc: "low to high",
};

const PAGE_SIZE = 25;

function sortStatusText(sort: AirdropSortKey, dir: SortDir) {
  const ranking = `Sorted by ${SORT_LABELS[sort]}, ${SORT_DIR_LABELS[dir]}`;
  if (sort === "days") {
    return `${ranking}. Days counts the daily snapshots a wallet earned in, so it can be lower than the period length.`;
  }
  return ranking;
}

function AirdropLeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [sort, setSort] = useState<AirdropSortKey>("seer");
  // Ranking direction is fixed. A leaderboard is read top-down; ascending only ever surfaced the
  // smallest holders, so the columns choose WHAT to rank by, never which end to show first. The
  // API and the CSV export still take a direction, so it stays a value rather than disappearing.
  const dir: SortDir = "desc";
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [highlightAddress, setHighlightAddress] = useState<string | undefined>();
  const [rankStatus, setRankStatus] = useState<"idle" | "loading" | "missing" | "error">("idle");
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  const query = useAirdropLeaderboard({
    period,
    sort,
    dir,
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const rows = query.data?.rows ?? [];
  const isInitialLoad = query.isPending && !query.data;
  const isRefreshing = query.isFetching && !!query.data;
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE));
  const hasRowsToExport = (query.data?.total ?? 0) > 0;

  useEffect(() => {
    if (!highlightAddress) return;
    const frame = requestAnimationFrame(() => {
      highlightedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [highlightAddress, page, query.data?.rows]);

  const resetPaging = () => {
    setPage(0);
    setHighlightAddress(undefined);
    setRankStatus("idle");
  };

  const toggleSort = (key: AirdropSortKey) => {
    if (sort === key) {
      return; // already ranking by this column, and there is no other direction to go to
    }
    setSort(key);
    resetPaging();
  };

  const jumpToMyRank = async () => {
    if (!connectedAddress) return;
    setRankStatus("loading");
    try {
      const result = await fetchAirdropRank({ period, sort, dir, address: connectedAddress });
      if (result.rank == null) {
        setRankStatus("missing");
        setHighlightAddress(undefined);
        return;
      }
      setSearch("");
      setSearchInput("");
      setPage(Math.floor((result.rank - 1) / PAGE_SIZE));
      setHighlightAddress(connectedAddress.toLowerCase());
      setRankStatus("idle");
    } catch {
      setRankStatus("error");
    }
  };

  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[32px]">
      <Breadcrumb links={[{ title: "Leaderboard", url: "/leaderboard" }, { title: "Airdrop" }]} />

      <LeaderboardTabs active="airdrop" />

      <div className="space-y-2">
        <h1 className="text-[28px] lg:text-[36px] font-semibold text-base-content">Airdrop Leaderboard</h1>
        <p className="text-black-secondary max-w-2xl">
          Rankings of wallets by SEER earned from the airdrop, across all chains. <strong>Holdings</strong> comes from
          outcome tokens held at each daily snapshot, and <strong>Proof of Humanity</strong> from being a verified
          unique person; together they make up the total. The two percentage columns measure each of those against{" "}
          <em>its own pool</em> — a wallet with a tenth of the PoH pool reads as 10% there — so they are separate
          standings and are not meant to be added together. The pools are a quarter of the whole airdrop each; the other
          half is the separate SER LPP liquidity programme. These are estimates and are not claimable.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PeriodFilter
          value={period}
          onChange={(p) => {
            setPeriod(p);
            resetPaging();
          }}
        />

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <a
            href={airdropLeaderboardCsvUrl({ period, sort, dir, search })}
            download
            className={clsx(
              "btn btn-sm btn-ghost border border-separator-100 gap-2",
              !hasRowsToExport && "pointer-events-none opacity-50",
            )}
            aria-disabled={!hasRowsToExport}
            tabIndex={hasRowsToExport ? undefined : -1}
          >
            <ExportIcon />
            Export CSV
          </a>

          {connectedAddress ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={rankStatus === "loading"}
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
        <p className="text-sm text-black-secondary">Your connected wallet has not earned any SEER in this period.</p>
      ) : null}
      {rankStatus === "error" ? <p className="text-sm text-error">Could not look up your rank. Try again.</p> : null}

      <div className="bg-base-100 border border-separator-100 rounded-[1px] shadow-[0_2px_3px_0_rgba(0,0,0,0.06)] overflow-x-auto">
        {query.error && rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-separator-100">
            <p className="text-sm text-error">{query.error.message || "Failed to refresh leaderboard"}</p>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => void query.refetch()}>
              Retry
            </button>
          </div>
        ) : null}

        <p className="text-sm text-black-secondary px-4 pt-3 pb-1">
          <span id="airdrop-leaderboard-sort-status" aria-live="polite">
            {sortStatusText(sort, dir)}
            {isRefreshing ? " Updating…" : ""}
          </span>{" "}
          Export CSV downloads every row for this period and sort, not just this page.
        </p>

        <table className="table" aria-busy={query.isFetching} aria-describedby="airdrop-leaderboard-sort-status">
          <thead>
            <tr>
              <th className="w-16">#</th>
              <th>Account</th>
              <SortableHeader
                label={SORT_LABELS.seer}
                sortKey="seer"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              <SortableHeader
                label={SORT_LABELS.holdings}
                sortKey="holdings"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              {/*
               * Neither percentage is sortable: within a period every row divides by the same
               * snapshot-day count, so ranking by a pool percentage is the same ordering as ranking
               * by the SEER column it sits next to. A header doing exactly what its neighbour does
               * would only be a second way to get the same board.
               */}
              <th className="text-right">% of holdings pool</th>
              <SortableHeader
                label={SORT_LABELS.poh}
                sortKey="poh"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              <th className="text-right">% of PoH pool</th>
              <SortableHeader
                label={SORT_LABELS.days}
                sortKey="days"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
            </tr>
          </thead>
          <tbody className={clsx(isRefreshing && "opacity-60")}>
            {isInitialLoad ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-black-secondary">
                  Loading leaderboard…
                </td>
              </tr>
            ) : query.error && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <div className="space-y-3">
                    <p className="text-error">{query.error.message || "Failed to load leaderboard"}</p>
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => void query.refetch()}>
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-black-secondary">
                  {search ? "No wallets match that address." : "No airdrop allocations in this period yet."}
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
                    <td className="text-right font-semibold tabular-nums">{formatSeer(row.seer)}</td>
                    <td className="text-right tabular-nums">{formatSeer(row.holdings)}</td>
                    <td className="text-right tabular-nums">{formatPct(row.pctOfHoldings)}</td>
                    <td className="text-right tabular-nums">
                      <span className={clsx(row.isPoh && "text-purple-primary dark:text-purple-secondary font-medium")}>
                        {formatSeer(row.poh)}
                      </span>
                      {row.isPoh ? (
                        <span
                          className="ml-2 text-xs text-purple-primary dark:text-purple-secondary"
                          title="Proof of Humanity verified"
                        >
                          ✓
                        </span>
                      ) : null}
                    </td>
                    <td className="text-right tabular-nums">{formatPct(row.pctOfPoh)}</td>
                    <td className="text-right tabular-nums">{row.days}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {(query.data?.total ?? 0) > PAGE_SIZE ? (
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
    </div>
  );
}

export default AirdropLeaderboardPage;
