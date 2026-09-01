import Breadcrumb from "@/components/Breadcrumb";
import { AddressOrName } from "@/components/ConnectWallet/AccountDisplay";
import { LeaderboardTabs } from "@/components/Leaderboard/LeaderboardTabs";
import { PeriodFilter } from "@/components/Leaderboard/PeriodFilter";
import { type SortDir, SortableHeader } from "@/components/Leaderboard/SortableHeader";
import { type AirdropSortKey, fetchAirdropRank, useAirdropLeaderboard } from "@/hooks/airdrop/useAirdropLeaderboard";
import { formatSeer } from "@/lib/airdropFormat";
import type { LeaderboardPeriod } from "@/lib/leaderboardPeriods";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const SORT_LABELS: Record<AirdropSortKey, string> = {
  seer: "SEER",
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
  const [dir, setDir] = useState<SortDir>("desc");
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
      setDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSort(key);
      setDir("desc");
    }
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
          unique person; together they make up the total. These are estimates and are not claimable.
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

        <p
          id="airdrop-leaderboard-sort-status"
          className="text-sm text-black-secondary px-4 pt-3 pb-1"
          aria-live="polite"
        >
          {sortStatusText(sort, dir)}
          {isRefreshing ? " Updating…" : ""}
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
              />
              <SortableHeader
                label={SORT_LABELS.holdings}
                sortKey="holdings"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
              />
              <SortableHeader
                label={SORT_LABELS.poh}
                sortKey="poh"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
              />
              <SortableHeader
                label={SORT_LABELS.days}
                sortKey="days"
                activeSort={sort}
                activeDir={dir}
                onSort={toggleSort}
              />
            </tr>
          </thead>
          <tbody className={clsx(isRefreshing && "opacity-60")}>
            {isInitialLoad ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-black-secondary">
                  Loading leaderboard…
                </td>
              </tr>
            ) : query.error && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
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
                <td colSpan={6} className="text-center py-10 text-black-secondary">
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
