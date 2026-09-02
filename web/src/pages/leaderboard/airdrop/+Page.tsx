import Breadcrumb from "@/components/Breadcrumb";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { LeaderboardTabs } from "@/components/Leaderboard/LeaderboardTabs";
import { PeriodFilter } from "@/components/Leaderboard/PeriodFilter";
import type { SortDir } from "@/components/Leaderboard/SortableHeader";
import {
  type AirdropSortKey,
  airdropLeaderboardCsvUrl,
  fetchAirdropRank,
  useAirdropLeaderboard,
} from "@/hooks/airdrop/useAirdropLeaderboard";
import { formatPct, formatSeer } from "@/lib/airdropFormat";
import { ExportIcon } from "@/lib/icons";
import { type LeaderboardPeriod, PERIOD_LABELS } from "@/lib/leaderboardPeriods";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const PAGE_SIZE = 25;

const DAYS_HINT = "Daily snapshots the wallet earned in, so it can be lower than the period length.";

const SER_LPP_HINT = "SEER from the liquidity program. A running balance, counted on ALL only.";

/** What the board is ranked by. There is no column picker, so this only varies with the period. */
function rankingText(period: LeaderboardPeriod) {
  return period === "all"
    ? "Ranked by Total, high to low. Total is Holdings + Proof of Humanity + SER-LPP."
    : `Ranked by Total, high to low. Total is Holdings + Proof of Humanity; SER-LPP is a running balance and is not counted in a ${PERIOD_LABELS[period]} window.`;
}

function AirdropLeaderboardPage() {
  const { address: connectedAddress } = useAccount();
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  // Ranking is fixed: by Total, highest first. A leaderboard is read top-down, and every other
  // column was only ever a second route to the same board — holdings and PoH are components of
  // Total, and each percentage is a positive multiple of the SEER column beside it. The API and
  // the CSV export still take both, so they stay values rather than disappearing.
  const sort: AirdropSortKey = "seer";
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
          unique person; together they make up the total. The two <strong>% of airdrop</strong> columns measure each of
          those against everything emitted in the period, the separate SER LPP liquidity programme included, so they add
          up to the wallet's share of the whole. Each of these two pools is a quarter of that whole, so a wallet holding
          a tenth of the PoH pool reads as 2.5%. <strong>SER-LPP</strong> is the reward for providing liquidity on
          incentivized markets, in the same SEER unit — a running balance rather than a daily emission, so it is counted
          in <strong>Total</strong> on ALL only and left out of the two percentages. These are estimates and are not
          claimable.
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
          <span id="airdrop-leaderboard-note" aria-live="polite">
            {rankingText(period)}
            {isRefreshing ? " Updating…" : ""}
          </span>{" "}
          Export CSV downloads every row for this period, not just this page.
        </p>

        <table className="table" aria-busy={query.isFetching} aria-describedby="airdrop-leaderboard-note">
          <thead>
            <tr>
              <th className="w-16">#</th>
              <th>Account</th>
              {/*
               * Plain headers, no sorting. Every column here is either a component of Total or a
               * positive multiple of the SEER column beside it, so each one only re-ranked the
               * same board; SER-LPP is the exception but is 0 on three of the four periods.
               */}
              <th className="text-right">Total</th>
              <th className="text-right">Holdings</th>
              <th className="text-right">% of airdrop (holdings)</th>
              <th className="text-right">Proof of Humanity</th>
              <th className="text-right">% of airdrop (PoH)</th>
              <th className="text-right" title={SER_LPP_HINT}>
                SER-LPP
              </th>
              <th className="text-right" title={DAYS_HINT}>
                Days
              </th>
            </tr>
          </thead>
          <tbody className={clsx(isRefreshing && "opacity-60")}>
            {isInitialLoad ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-black-secondary">
                  Loading leaderboard…
                </td>
              </tr>
            ) : query.error && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
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
                <td colSpan={9} className="text-center py-10 text-black-secondary">
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
                    <td className="text-right font-semibold tabular-nums">{formatSeer(row.total)}</td>
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
                    <td className="text-right tabular-nums">{formatSeer(row.serLpp)}</td>
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
