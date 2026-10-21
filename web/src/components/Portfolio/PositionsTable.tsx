import React, { useState } from "react";

import { useModal } from "@/hooks/useModal";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { CloseIcon, ConditionalMarketIcon, QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isExecutorRow } from "@/lib/utils";
import { useMarket } from "@seer-pm/react";
import type { PortfolioChainId, PortfolioCostBasisRow, PortfolioPosition, SupportedChain } from "@seer-pm/sdk";
import { getActiveCollateralProfile } from "@seer-pm/sdk";
import { MarketStatus } from "@seer-pm/sdk";
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import MarketsPagination from "../Market/MarketsPagination";
import { OutcomeImage } from "../Market/OutcomeImage";
import { RedeemForm } from "../Market/RedeemForm";
import Popover from "../Popover";
import { ExecutorBadge } from "./ExecutorBadge";
import { SortableColumnHeader } from "./SortableColumnHeader";
import {
  type CostBasisLookup,
  MARKET_PNL_PERIOD_LABEL,
  type MarketPnlLookup,
  costBasisKey,
  marketPnlKey,
} from "./marketPnl";

function RedeemModalContent({
  account,
  marketId,
  chainId,
  closeModal,
}: {
  account?: Address;
  marketId: Address;
  chainId: SupportedChain;
  closeModal: () => void;
}) {
  const { data: market, isPending: isMarketPending } = useMarket(marketId, chainId);
  if (isMarketPending) {
    return <div className="shimmer-container w-full h-10"></div>;
  }
  if (!market) {
    return <Alert type="warning">There's nothing to redeem.</Alert>;
  }
  return (
    <div className="space-y-4">
      <p className="font-semibold text-purple-primary">{market.marketName}</p>
      <RedeemForm account={account} market={market} successCallback={() => closeModal()} />
    </div>
  );
}

function ExpandedBasis({
  entry,
  chainId,
}: {
  entry: { basis: PortfolioCostBasisRow } | undefined;
  chainId: SupportedChain;
}) {
  if (!entry) return null;
  const symbol = getActiveCollateralProfile(chainId).primary.symbol;
  const { realized, totalBought, totalSold, evenSplit } = entry.basis;
  const format = (n: number) => (Math.abs(n) < 0.01 ? n.toFixed(6).replace(/\.?0+$/, "") : n.toFixed(2));
  // Float residue from a closed round trip must not read as a signed loss.
  const realizedLabel = format(Math.abs(realized));
  const flat = realizedLabel === "0";
  return (
    <>
      <span>
        Realized on this outcome
        <b className={flat ? "" : realized < 0 ? "portfolio-loss" : "portfolio-gain"}>
          {flat ? "" : realized < 0 ? "−" : "+"}
          {realizedLabel} {symbol}
        </b>
      </span>
      <span>
        Bought / sold, all time
        <b>
          {format(totalBought)} / {format(totalSold)} {symbol}
        </b>
      </span>
      {evenSplit && (
        <span>
          Note
          <b>A split with no pool price was spread evenly across outcomes</b>
        </span>
      )}
    </>
  );
}

function PositionsTableInner({
  data,
  chainId,
  account,
  showRedeemColumn,
  marketPnl,
  costBasis,
}: {
  data: PortfolioPosition[];
  chainId: PortfolioChainId;
  account: Address | undefined;
  showRedeemColumn: boolean;
  marketPnl: MarketPnlLookup;
  costBasis: CostBasisLookup;
}) {
  const { Modal, openModal, closeModal } = useModal("redeem-modal");
  const [selectedMarketId, setSelectedMarketId] = useState<Address>(zeroAddress);
  const [selectedChainId, setSelectedChainId] = useState<SupportedChain>(chainId === "all" ? DEFAULT_CHAIN : chainId);
  const showChain = chainId === "all";
  const [expanded, setExpanded] = useState<string>();
  function formatSmallNumber(n: number | undefined) {
    if (typeof n !== "number") return "-";
    if (n === 0) return "0";
    if (Math.abs(n) < 0.01) {
      return n.toFixed(6).replace(/\.?0+$/, "");
    }

    return n.toFixed(2);
  }
  const shares = (row: PortfolioPosition) => row.tokenBalance + (row.lpTokenBalance ?? 0);
  /**
   * The position's basis, when it can be shown. Cost follows the live share count at the stored
   * average, so a trade made after the last refresh moves the cost with the shares instead of
   * leaving the two out of step.
   */
  const basisOf = (row: PortfolioPosition) => {
    const wallet = row.sourceWallet ?? account;
    const basis = wallet ? costBasis.byKey.get(costBasisKey(row.chainId, row.tokenId, wallet)) : undefined;
    if (!basis || basis.lpTouched || basis.averageCost === undefined) return undefined;
    const cost = basis.averageCost * shares(row);
    return { basis, averageCost: basis.averageCost, cost, positionPnl: row.tokenValue - cost };
  };
  const columns = React.useMemo<ColumnDef<PortfolioPosition>[]>(() => {
    const periodLabel = MARKET_PNL_PERIOD_LABEL[marketPnl.period];
    // The figures belong to the wallet that holds the row: an executor's trades are stored under
    // the executor, so a lookup on the viewed account would show the owner's own trades on it.
    const marketFigures = (row: PortfolioPosition) => {
      const wallet = row.sourceWallet ?? account;
      return wallet ? marketPnl.byKey.get(marketPnlKey(row.chainId, row.marketId, wallet)) : undefined;
    };
    const unavailable = (title: string, label = "-") => (
      <span className="portfolio-muted" title={title}>
        {label}
      </span>
    );
    const marketFigureCell = (row: PortfolioPosition, value: number | undefined, signed: boolean) => {
      if (marketPnl.error) return unavailable(marketPnl.error);
      if (!marketPnl.loaded) return unavailable("Loading", "…");
      if (marketPnl.notComputed)
        return unavailable("The P/L refresh job has not processed this wallet yet", "Not computed");
      if (value === undefined) return unavailable(`No trades on this market in the ${periodLabel} window`);
      const symbol = showChain ? ` ${getActiveCollateralProfile(row.chainId).primary.symbol}` : "";
      const magnitude = formatSmallNumber(Math.abs(value));
      // A value that rounds to nothing is shown as a plain zero: a signed "+0" claims a direction
      // the displayed digits cannot support.
      if (!signed || magnitude === "0") {
        return (
          <p className={`font-semibold text-[14px] text-center${magnitude === "0" ? " portfolio-muted" : ""}`}>
            {magnitude}
            {symbol}
          </p>
        );
      }
      return (
        <p className={`font-semibold text-[14px] text-center ${value < 0 ? "portfolio-loss" : "portfolio-gain"}`}>
          {value < 0 ? "−" : "+"}
          {magnitude}
          {symbol}
        </p>
      );
    };
    const basisUnavailable = (row: PortfolioPosition) => {
      if (costBasis.error) return unavailable(costBasis.error);
      if (!costBasis.loaded) return unavailable("Loading", "…");
      if (costBasis.notComputed)
        return unavailable("The P/L refresh job has not processed this wallet yet", "Not computed");
      const wallet = row.sourceWallet ?? account;
      const basis = wallet ? costBasis.byKey.get(costBasisKey(row.chainId, row.tokenId, wallet)) : undefined;
      if (basis?.lpTouched)
        return unavailable("This position went through a liquidity pool; cost basis is not tracked for it yet");
      return unavailable("No acquisition history found for this position");
    };
    const approxMark = (row: PortfolioPosition) =>
      basisOf(row)?.basis.approximate ? (
        <span title="Approximate: an acquisition event could not be pinned down" className="portfolio-muted">
          ≈
        </span>
      ) : null;
    const redeemColumn: ColumnDef<PortfolioPosition> = {
      accessorKey: "marketStatus",
      cell: (info) => {
        const position = info.row.original;
        if (isExecutorRow(position.sourceWallet, account)) {
          // The tokens sit inside the TradeExecutor contract; the redeem modal acts from the
          // connected wallet, so it cannot reach them. Say so rather than offer a button that
          // would redeem nothing.
          return (
            <Popover
              label="Held by a Trade Executor"
              width={260}
              trigger={
                <p className="text-[14px] text-black-secondary underline decoration-dotted">Held by Trade Executor</p>
              }
              content={
                <div className="text-[14px] space-y-1">
                  <p>
                    These tokens are held by a Trade Executor contract, not by this wallet, so they cannot be redeemed
                    here.
                  </p>
                  <p className="text-black-secondary break-all">{position.sourceWallet}</p>
                </div>
              }
            />
          );
        }
        if (info.getValue<string>() === MarketStatus.CLOSED) {
          return (
            <button
              type="button"
              className={`items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-purple-primary text-white text-[14px] px-4 py-[10px] min-h-11 ${position.tokenBalance > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              disabled={position.tokenBalance <= 0}
              title={position.tokenBalance <= 0 ? "Withdraw liquidity before redeeming" : undefined}
              onClick={() => {
                setSelectedMarketId(position.marketId);
                setSelectedChainId(position.chainId);
                openModal();
              }}
            >
              Redeem
            </button>
          );
        }
        return <p className="text-[14px] text-black-secondary">Not redeemable</p>;
      },
      header: "Redeem",
      sortingFn: (rowA, rowB) => {
        const statusA = rowA.original.marketStatus;
        const statusB = rowB.original.marketStatus;
        if (statusA === MarketStatus.CLOSED && statusB !== MarketStatus.CLOSED) {
          return -1;
        }
        if (statusA !== MarketStatus.CLOSED && statusB === MarketStatus.CLOSED) {
          return 1;
        }
        return 0;
      },
    };

    return [
      {
        accessorKey: "marketName",
        cell: (info) => {
          const position = info.row.original;
          const rowChainId = position.chainId;
          const chainName = SUPPORTED_CHAINS[rowChainId as keyof typeof SUPPORTED_CHAINS]?.name;
          return (
            <div className="portfolio-market-cell">
              <span className="portfolio-market-symbol">
                <OutcomeImage
                  image={position.outcomeImage}
                  title={position.outcome}
                  isInvalidOutcome={position.isInvalidOutcome}
                  className="w-full h-full rounded-full object-cover"
                />
              </span>
              <div>
                <a
                  className="portfolio-market-name"
                  title={position.marketName}
                  href={`${paths.market(position.marketId, rowChainId)}?outcome=${encodeURIComponent(position.outcome)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {position.marketName}
                </a>
                <span className="portfolio-outcome" title={position.outcome}>
                  {position.outcome}
                </span>
                {showChain && (
                  <small className="portfolio-muted inline-flex items-center gap-1">
                    {" "}
                    {NETWORK_ICON_MAPPING[rowChainId] && (
                      <img alt="" className="w-3 h-3 rounded-full" src={NETWORK_ICON_MAPPING[rowChainId]} />
                    )}
                    {chainName} · {getActiveCollateralProfile(rowChainId).primary.symbol}
                  </small>
                )}
                {isExecutorRow(position.sourceWallet, account) && (
                  <ExecutorBadge wallet={position.sourceWallet as Address} />
                )}
                {position.parentMarketId && (
                  <small className="portfolio-muted block">
                    <Popover
                      label="Conditional market. Show the parent market."
                      trigger={
                        <span className="inline-flex items-center gap-1" title="Conditional Market">
                          <ConditionalMarketIcon width="14" fill="currentColor" /> Conditional on{" "}
                          <span className="underline decoration-dotted">{position.parentOutcome}</span>
                        </span>
                      }
                      content={
                        <p className="text-base-content/70 text-[14px]">
                          Conditional on{" "}
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline text-purple-primary cursor-pointer hover:underline"
                            href={`${paths.market(position.parentMarketId, rowChainId)}?outcome=${encodeURIComponent(position.parentOutcome ?? "")}`}
                          >
                            "{position.parentMarketName}"
                          </a>{" "}
                          being <span className="text-base-content">"{position.parentOutcome}"</span>
                        </p>
                      }
                    />
                  </small>
                )}
                {((position.lpTokenBalance ?? 0) > 0 || (position.lpLegs?.length ?? 0) > 0) && (
                  <small className="portfolio-muted block">
                    {formatSmallNumber(position.tokenBalance)} held · {formatSmallNumber(position.lpTokenBalance ?? 0)}{" "}
                    in LP
                  </small>
                )}
              </div>
            </div>
          );
        },
        header: "Market / outcome",
      },

      {
        id: "entry",
        accessorFn: (row) => basisOf(row)?.averageCost,
        sortUndefined: "last",
        header: "Avg. entry",
        cell: (info) => {
          const row = info.row.original;
          const entry = basisOf(row);
          if (!entry) return basisUnavailable(row);
          const symbol = showChain ? ` ${getActiveCollateralProfile(row.chainId).primary.symbol}` : "";
          return (
            <p className="font-semibold text-[14px] text-center">
              {approxMark(row)}
              {formatSmallNumber(entry.averageCost)}
              {symbol}
            </p>
          );
        },
      },
      {
        accessorKey: "tokenPrice",
        cell: (info) => {
          const position = info.row.original;
          const symbol = getActiveCollateralProfile(position.chainId).primary.symbol;
          const suffix = showChain ? ` ${symbol}` : "";
          if (position.marketStatus === MarketStatus.CLOSED && Number.isFinite(position.redeemedPrice)) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2 justify-center">
                <p>
                  {position.redeemedPrice.toFixed(4)}
                  {suffix}
                </p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[120px]">Redeem price</p>
                  <QuestionIcon fill="#7D33FF" />
                </span>
              </div>
            );
          }
          if (position.parentMarketId) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2 justify-center">
                <p>
                  {formatSmallNumber(info.getValue<number>())}
                  {suffix}
                </p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[300px]">
                    = relative price to parent outcome &times; parent's {symbol} price
                  </p>
                  <QuestionIcon fill="#7D33FF" />
                </span>
              </div>
            );
          }
          return (
            <p className="font-semibold text-[14px] text-center">
              {Number.isFinite(info.getValue<number>()) ? formatSmallNumber(info.getValue<number>()) : "N/A"}
              {suffix}
            </p>
          );
        },
        header: "Now",
      },

      {
        id: "shares",
        accessorFn: (row) => row.tokenBalance + (row.lpTokenBalance ?? 0),
        header: "Shares",
        cell: (info) => formatSmallNumber(info.getValue<number>()),
      },
      {
        id: "cost",
        accessorFn: (row) => basisOf(row)?.cost,
        sortUndefined: "last",
        header: "Cost",
        cell: (info) => {
          const row = info.row.original;
          const entry = basisOf(row);
          if (!entry) return basisUnavailable(row);
          const symbol = showChain ? ` ${getActiveCollateralProfile(row.chainId).primary.symbol}` : "";
          return (
            <p className="font-semibold text-[14px] text-center">
              {approxMark(row)}
              {formatSmallNumber(entry.cost)}
              {symbol}
            </p>
          );
        },
      },
      {
        accessorKey: "tokenValue",
        cell: (info) => {
          const position = info.row.original;
          const symbol = showChain ? ` ${getActiveCollateralProfile(position.chainId).primary.symbol}` : "";
          const entry = basisOf(position);
          const pnl = entry?.positionPnl;
          const magnitude = pnl === undefined ? undefined : formatSmallNumber(Math.abs(pnl));
          const flat = magnitude === "0";
          const tone = pnl === undefined || flat ? "portfolio-muted" : pnl < 0 ? "portfolio-loss" : "portfolio-gain";
          const sign = pnl !== undefined && pnl < 0 ? "−" : "+";
          const returnPct =
            entry && pnl !== undefined && entry.cost > 0 && !flat
              ? ` (${sign}${((Math.abs(pnl) / entry.cost) * 100).toFixed(2)}%)`
              : "";
          return (
            <p className="font-semibold text-[14px] text-center">
              {formatSmallNumber(info.getValue<number>())}
              {symbol}
              {entry && magnitude !== undefined && (
                <small className={`block font-normal ${tone}`}>
                  {approxMark(position)}
                  {flat ? "0" : `${sign}${magnitude}`}
                  {returnPct}
                </small>
              )}
            </p>
          );
        },
        header: "Value / P&L",
      },
      {
        id: "positionPnl",
        accessorFn: (row) => basisOf(row)?.positionPnl,
        sortUndefined: "last",
        header: "Position P/L",
      },
      {
        id: "traded",
        accessorFn: (row) => marketFigures(row)?.volume,
        sortUndefined: "last",
        header: `Traded · ${periodLabel}`,
        cell: (info) => marketFigureCell(info.row.original, info.getValue<number | undefined>(), false),
      },
      {
        id: "pnl",
        accessorFn: (row) => marketFigures(row)?.pnl,
        sortUndefined: "last",
        header: `Market P/L · ${periodLabel}`,
        cell: (info) => marketFigureCell(info.row.original, info.getValue<number | undefined>(), true),
      },
      ...(showRedeemColumn ? [redeemColumn] : []),
      {
        id: "details",
        header: "",
        enableSorting: false,
        cell: (info) => (
          <button
            className="portfolio-expand"
            type="button"
            aria-label={`${expanded === info.row.id ? "Hide" : "Show"} ${info.row.original.outcome} details`}
            aria-expanded={expanded === info.row.id}
            onClick={() => setExpanded(expanded === info.row.id ? undefined : info.row.id)}
          >
            {expanded === info.row.id ? "−" : "+"}
          </button>
        ),
      },
    ];
  }, [showChain, showRedeemColumn, account, expanded, marketPnl, costBasis]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useReactTable({
    columns,
    data,
    getRowId: (row) => `${row.chainId}:${row.tokenId}:${row.sourceWallet ?? "owner"}`,
    // `positionPnl` exists to sort by; the figure itself is shown under Value.
    state: { pagination, columnVisibility: { positionPnl: false } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    enableMultiSort: true,
    initialState: {
      // Owners get redeemable positions first: that is the row with an action to take.
      sorting: showRedeemColumn
        ? [
            { id: "marketStatus", desc: false },
            { id: "tokenValue", desc: true },
          ]
        : [{ id: "tokenValue", desc: true }],
    },
  });

  return (
    <>
      <div className="portfolio-table-tools">
        <label>
          Sort by{" "}
          <select
            aria-label="Sort positions"
            value={table.getState().sorting[0]?.id ?? "tokenValue"}
            onChange={(event) => {
              const id = event.target.value;
              table.setSorting(
                id === "marketStatus"
                  ? [
                      { id, desc: false },
                      { id: "tokenValue", desc: true },
                    ]
                  : [{ id, desc: id !== "marketName" }],
              );
              table.setPageIndex(0);
            }}
          >
            {showRedeemColumn && <option value="marketStatus">Redeemable first</option>}
            <option value="tokenValue">Current value</option>
            <option value="marketName">Market name</option>
            <option value="shares">Shares</option>
            <option value="positionPnl">Position P/L</option>
            <option value="entry">Avg. entry</option>
            <option value="traded">Traded</option>
            <option value="pnl">Market P/L</option>
          </select>
        </label>
      </div>
      <section className="w-full overflow-x-auto mb-6" aria-label="Position details" tabIndex={0}>
        {showRedeemColumn && (
          <Modal
            title="Redeem"
            content={
              <div>
                <button
                  type="button"
                  className="absolute right-[20px] top-[20px] hover:opacity-60"
                  onClick={() => closeModal()}
                  aria-label="Close modal"
                >
                  <CloseIcon fill="currentColor" />
                </button>
                <RedeemModalContent
                  account={account}
                  marketId={selectedMarketId as Address}
                  chainId={selectedChainId}
                  closeModal={closeModal}
                />
              </div>
            }
            className="[&_.btn-primary]:w-full"
          />
        )}
        <table className="simple-table portfolio-positions-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan} className={index > 0 ? "text-center" : ""}>
                      <SortableColumnHeader header={header} align={index > 0 ? "center" : "left"} />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <React.Fragment key={row.id}>
                  <tr>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td className={cell.column.id === "marketName" ? "text-left" : "text-center"} key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                  {expanded === row.id && (
                    <tr className="portfolio-expanded-row">
                      <td colSpan={row.getVisibleCells().length}>
                        <div className="portfolio-expanded-grid">
                          <span>
                            Settlement
                            <b>
                              {row.original.marketStatus === MarketStatus.CLOSED
                                ? "Resolved"
                                : "Open · not yet redeemable"}
                            </b>
                          </span>
                          {isAddressEqual(
                            row.original.collateralToken,
                            getActiveCollateralProfile(row.original.chainId).primary.address,
                          ) && (
                            <span>
                              If this outcome wins
                              <b>
                                {formatSmallNumber(shares(row.original))}{" "}
                                {getActiveCollateralProfile(row.original.chainId).primary.symbol}
                                <small className="portfolio-muted"> · categorical payout of 1 per share</small>
                              </b>
                            </span>
                          )}
                          <ExpandedBasis entry={basisOf(row.original)} chainId={row.original.chainId} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </section>
      {table.getPageCount() > 1 && (
        <MarketsPagination
          pageCount={table.getPageCount()}
          handlePageClick={({ selected }) => table.setPageIndex(selected)}
          page={table.getState().pagination.pageIndex + 1}
        />
      )}
    </>
  );
}

export default function PositionsTable({
  data,
  chainId,
  account,
  marketPnl,
  costBasis,
}: {
  data: PortfolioPosition[];
  chainId: PortfolioChainId;
  account: Address | undefined;
  marketPnl: MarketPnlLookup;
  costBasis: CostBasisLookup;
}) {
  const { address: connectedAddress } = useAccount();
  const showRedeemColumn =
    account !== undefined && connectedAddress !== undefined && isAddressEqual(account, connectedAddress);

  return (
    <PositionsTableInner
      key={showRedeemColumn ? "owner" : "viewer"}
      data={data}
      chainId={chainId}
      account={account}
      showRedeemColumn={showRedeemColumn}
      marketPnl={marketPnl}
      costBasis={costBasis}
    />
  );
}
