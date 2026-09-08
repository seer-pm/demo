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
import { formatPct, formatSeerWhole } from "@/lib/airdropFormat";
import { ExportIcon, QuestionIcon } from "@/lib/icons";
import { type LeaderboardPeriod, PERIOD_LABELS } from "@/lib/leaderboardPeriods";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

/**
 * One header per sort key now that each percentage shares a cell with the SEER figure it is
 * derived from. There is nothing left to fold: a percentage divides its column by the same
 * snapshot-day count for every row in the period, so it was never a distinct ranking, and the pair
 * of headers that used to say so is gone with the pair of columns.
 */
type ColumnKey = AirdropSortKey;

const SORT_LABELS: Record<ColumnKey, string> = {
  seer: "Total",
  holdings: "Holdings",
  poh: "Proof of Humanity",
  lpp: "SER-LPP",
  days: "Days",
};

const PAGE_SIZE = 25;

const DAYS_HINT = "Days counts the daily snapshots a wallet earned in, so it can be lower than the period length.";

const SER_LPP_HINT = "SEER from the liquidity program. A running balance, counted on ALL only.";

/**
 * What the board is ranked by. Direction is never in it: clicking a header changes the column, and
 * the board is always highest-first, so there is no second state to announce.
 */
function sortStatusText(column: ColumnKey, period: LeaderboardPeriod) {
  const ranking = `Sorted by ${SORT_LABELS[column]}, high to low`;
  if (column === "days") {
    return `${ranking}. ${DAYS_HINT}`;
  }
  if (column === "lpp") {
    return `${ranking}. ${SER_LPP_HINT}`;
  }
  if (column === "seer") {
    return period === "all"
      ? `${ranking}. Total is Holdings + Proof of Humanity + SER-LPP.`
      : `${ranking}. Total is Holdings + Proof of Humanity — SER-LPP is a running balance, so it appears on ALL only, not in a ${PERIOD_LABELS[period]} window.`;
  }
  return `${ranking}.`;
}

function AirdropLeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [column, setColumn] = useState<ColumnKey>("seer");
  // What the endpoint and the CSV export rank by. Every visible column maps to one sort key.
  const sort = column;
  // Direction is fixed. A header click picks WHAT the board ranks by; a leaderboard is read
  // top-down and ascending only ever surfaced the smallest holders, so there is no second
  // direction to toggle into. The API and the CSV export still take one, so it stays a value.
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

  // SER-LPP is a running balance with no per-day history, so the windowed boards have no column
  // for it at all — every row would read the same "not applicable" dash. The note above the table
  // says where it went, so switching to 1D does not look like data quietly disappearing.
  const showSerLpp = period === "all";
  // #, Account, Total, Holdings, Proof of Humanity, Days — plus SER-LPP on ALL.
  const columnCount = showSerLpp ? 7 : 6;

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

  const toggleSort = (key: ColumnKey) => {
    if (column === key) {
      return; // already ranking by this column, and there is no other direction to go to
    }
    setColumn(key);
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

      <div className="flex items-center gap-2">
        <h1 className="text-[28px] lg:text-[36px] font-semibold text-base-content">Airdrop Leaderboard</h1>
        {/*
         * The column glossary lives behind the icon rather than as a paragraph under the heading:
         * it is reference material you read once, and it was pushing the board itself below the
         * fold. The overrides are what it takes to hang a multi-paragraph body off the shared
         * `.tooltiptext`, which is built for one centred nowrap line above its trigger. This one
         * opens downward, since the heading sits near the top of the page and the stylesheet has no
         * flip, and left-aligned to the icon — centred, a 420px box would run off the left of the
         * container. `after:!hidden` drops the arrow, which the stylesheet only points downward.
         */}
        <span className="tooltip">
          <div
            className="tooltiptext !bottom-auto !top-[150%] !left-0 !translate-x-0 !whitespace-normal !text-left
              after:!hidden w-[280px] md:w-[420px] space-y-2 font-normal leading-relaxed"
          >
            <p>Wallets ranked by SEER earned from the airdrop, across all chains.</p>
            <p>
              <strong>Holdings</strong> comes from outcome tokens held at each daily snapshot,{" "}
              <strong>Proof of Humanity</strong> from being a verified unique person. Below each is that amount as a
              percentage of the whole airdrop emitted in the period. The two together make up the total.
            </p>
            <p>
              <strong>SER-LPP</strong> is the reward for providing liquidity on incentivized markets.
            </p>
            <p>These are estimates and are not claimable.</p>
          </div>
          <QuestionIcon fill="#9747FF" />
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PeriodFilter
          value={period}
          onChange={(p) => {
            setPeriod(p);
            // The SER-LPP column only exists on ALL, so leaving it would rank the board by a
            // hidden column that is 0 for every wallet — an ordering with no visible cause.
            if (p !== "all" && column === "lpp") {
              setColumn("seer");
            }
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
          <span id="airdrop-leaderboard-note" aria-live="polite">
            {sortStatusText(column, period)}
            {isRefreshing ? " Updating…" : ""}
          </span>{" "}
          Export CSV downloads every row for this period, not just this page.
        </p>

        <table className="table" aria-busy={query.isFetching} aria-describedby="airdrop-leaderboard-note">
          <thead>
            <tr>
              <th className="w-16">#</th>
              <th>Account</th>
              <SortableHeader
                label={SORT_LABELS.seer}
                sortKey="seer"
                activeSort={column}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              <SortableHeader
                label={SORT_LABELS.holdings}
                sortKey="holdings"
                activeSort={column}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              <SortableHeader
                label={SORT_LABELS.poh}
                sortKey="poh"
                activeSort={column}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
              {/*
               * Sortable only where it is rendered. `ser_lpp` is 0 on every period but ALL, so the
               * period switch above resets the key rather than leaving the board ranked by a
               * column that is neither visible nor discriminating.
               */}
              {showSerLpp ? (
                <SortableHeader
                  label={SORT_LABELS.lpp}
                  sortKey="lpp"
                  activeSort={column}
                  activeDir={dir}
                  onSort={toggleSort}
                  lockDescending
                />
              ) : null}
              <SortableHeader
                label={SORT_LABELS.days}
                sortKey="days"
                activeSort={column}
                activeDir={dir}
                onSort={toggleSort}
                lockDescending
              />
            </tr>
          </thead>
          <tbody className={clsx(isRefreshing && "opacity-60")}>
            {isInitialLoad ? (
              <tr>
                <td colSpan={columnCount} className="text-center py-10 text-black-secondary">
                  Loading leaderboard…
                </td>
              </tr>
            ) : query.error && rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="text-center py-10">
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
                <td colSpan={columnCount} className="text-center py-10 text-black-secondary">
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
                    <td className="text-right font-semibold tabular-nums">{formatSeerWhole(row.total)}</td>
                    {/*
                     * The share of the airdrop sits under its own SEER figure rather than in a
                     * column of its own: it is that number expressed a second way, and the two
                     * always sort together. Muted and smaller so the amount still leads the cell.
                     */}
                    <td className="text-right tabular-nums">
                      <div>{formatSeerWhole(row.holdings)}</div>
                      <div className="text-xs text-black-secondary">{formatPct(row.pctOfHoldings)}</div>
                    </td>
                    <td className="text-right tabular-nums">
                      <div>
                        <span
                          className={clsx(row.isPoh && "text-purple-primary dark:text-purple-secondary font-medium")}
                        >
                          {formatSeerWhole(row.poh)}
                        </span>
                        {row.isPoh ? (
                          <span
                            className="ml-2 text-xs text-purple-primary dark:text-purple-secondary"
                            title="Proof of Humanity verified"
                          >
                            ✓
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-black-secondary">{formatPct(row.pctOfPoh)}</div>
                    </td>
                    {showSerLpp ? <td className="text-right tabular-nums">{formatSeerWhole(row.serLpp)}</td> : null}
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
