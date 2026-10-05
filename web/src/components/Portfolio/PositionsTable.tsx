import React, { useState } from "react";
import type { ReviewPosition } from "./portfolio-review-data";

import { useModal } from "@/hooks/useModal";
import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/lib/chains";
import { CloseIcon, QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isExecutorRow } from "@/lib/utils";
import { useMarket } from "@seer-pm/react";
import type { PortfolioChainId, SupportedChain } from "@seer-pm/sdk";
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
import { RedeemForm } from "../Market/RedeemForm";
import Popover from "../Popover";
import { ExecutorBadge } from "./ExecutorBadge";
import { SortableColumnHeader } from "./SortableColumnHeader";

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

function PositionsTableInner({
  data,
  chainId,
  account,
  showRedeemColumn,
  review = false,
}: {
  data: ReviewPosition[];
  chainId: PortfolioChainId;
  account: Address | undefined;
  showRedeemColumn: boolean;
  review?: boolean;
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
  const singleChainSymbol = chainId === "all" ? null : getActiveCollateralProfile(chainId).primary.symbol;
  const columns = React.useMemo<ColumnDef<ReviewPosition>[]>(() => {
    const redeemColumn: ColumnDef<ReviewPosition> = {
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
              <span className="portfolio-market-symbol" aria-hidden="true">
                {position.outcomeImage ? (
                  <img src={position.outcomeImage} alt="" className="w-full h-full rounded-full object-cover" />
                ) : position.tokenIndex === 0 ? (
                  "ϟ"
                ) : (
                  "◎"
                )}
              </span>
              <div>
                {review ? (
                  <a
                    href={`${paths.market(position.marketId, rowChainId)}?outcome=${encodeURIComponent(position.outcome)}`}
                  >
                    {position.marketName}
                  </a>
                ) : (
                  <a
                    href={`${paths.market(position.marketId, rowChainId)}?outcome=${encodeURIComponent(position.outcome)}`}
                  >
                    {position.marketName}
                  </a>
                )}
                <span className="portfolio-outcome">{position.outcome}</span>
                {showChain && (
                  <small className="portfolio-muted">
                    {" "}
                    {chainName} · {getActiveCollateralProfile(rowChainId).primary.symbol}
                  </small>
                )}
                {isExecutorRow(position.sourceWallet, account) && (
                  <ExecutorBadge wallet={position.sourceWallet as Address} />
                )}
                {position.parentMarketId && (
                  <small className="portfolio-muted block">
                    Conditional on{" "}
                    <a
                      href={`${paths.market(position.parentMarketId, rowChainId)}?outcome=${encodeURIComponent(position.parentOutcome ?? "")}`}
                    >
                      {position.parentOutcome}
                    </a>
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
        accessorFn: (row) => row.reviewMetrics?.averageEntry,
        header: "Avg. entry",
        cell: (info) =>
          info.getValue<number>() === undefined ? (
            <span title="Acquisition cost is not supplied by the portfolio API">N/A</span>
          ) : (
            info.getValue<number>().toFixed(4)
          ),
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
              {Number.isFinite(info.getValue<number>()) ? info.getValue<number>().toFixed(4) : "N/A"}
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
        accessorFn: (row) => row.reviewMetrics?.cost,
        header: "Cost / traded",
        cell: (info) => (
          <>
            {formatSmallNumber(info.getValue<number>())}
            <small className="portfolio-secondary">
              {info.row.original.reviewMetrics
                ? `${formatSmallNumber(info.row.original.reviewMetrics.traded)} traded`
                : "Not available"}
            </small>
          </>
        ),
      },
      {
        id: "payout",
        accessorFn: (row) => row.reviewMetrics?.payout ?? row.reviewPayout,
        header: "If won",
        cell: (info) =>
          info.getValue<number>() === undefined ? (
            <span title="Payout depends on market settlement rules and is not supplied by this API">N/A</span>
          ) : (
            formatSmallNumber(info.getValue<number>())
          ),
      },
      {
        accessorKey: "tokenValue",
        cell: (info) => {
          const position = info.row.original;
          const symbol = showChain ? ` ${getActiveCollateralProfile(position.chainId).primary.symbol}` : "";
          return (
            <p className="font-semibold text-[14px] text-center">
              {formatSmallNumber(info.getValue<number>())}
              {symbol}
              {position.reviewMetrics ? (
                <>
                  <small
                    className={
                      position.tokenValue - position.reviewMetrics.cost >= 0
                        ? "portfolio-gain portfolio-secondary"
                        : "portfolio-loss portfolio-secondary"
                    }
                  >
                    {position.tokenValue >= position.reviewMetrics.cost ? "+" : ""}
                    {formatSmallNumber(position.tokenValue - position.reviewMetrics.cost)}
                  </small>
                  <small
                    className={
                      position.tokenValue >= position.reviewMetrics.cost
                        ? "portfolio-gain portfolio-secondary"
                        : "portfolio-loss portfolio-secondary"
                    }
                  >
                    {position.reviewMetrics.cost > 0
                      ? `(${position.tokenValue >= position.reviewMetrics.cost ? "+" : ""}${(((position.tokenValue - position.reviewMetrics.cost) / position.reviewMetrics.cost) * 100).toFixed(2)}%)`
                      : "Return unavailable"}
                  </small>
                </>
              ) : (
                <small className="portfolio-secondary" title="Remaining cost basis is not supplied by the API">
                  P&L unavailable
                </small>
              )}
            </p>
          );
        },
        header: "Value / P&L",
      },
      ...(showRedeemColumn ? [redeemColumn] : []),
      {
        id: "profit",
        accessorFn: (row) => (row.reviewMetrics ? row.tokenValue - row.reviewMetrics.cost : undefined),
        header: "Profit / loss",
      },
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
  }, [showChain, showRedeemColumn, singleChainSymbol, account, review, expanded]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useReactTable({
    columns,
    data,
    getRowId: (row) => `${row.chainId}:${row.tokenId}:${row.sourceWallet ?? "owner"}`,
    state: { pagination, columnVisibility: { profit: false } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    enableMultiSort: true,
    initialState: {
      sorting: [{ id: "tokenValue", desc: true }],
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
              table.setSorting([{ id: event.target.value, desc: event.target.value !== "marketName" }]);
              table.setPageIndex(0);
            }}
          >
            <option value="tokenValue">Current value</option>
            <option value="marketName">Market name</option>
            <option value="shares">Shares</option>
            <option value="profit" disabled={!data.some((row) => row.reviewMetrics)}>
              Profit / loss
            </option>
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
                            Amount traded (buys + sells)
                            <b>
                              {row.original.reviewMetrics
                                ? `${formatSmallNumber(row.original.reviewMetrics.traded)} ${getActiveCollateralProfile(row.original.chainId).primary.symbol}`
                                : "Not available"}
                            </b>
                          </span>
                          <span>
                            Gross payout if outcome wins
                            <b>
                              {(row.original.reviewMetrics?.payout ?? row.original.reviewPayout) !== undefined
                                ? `${formatSmallNumber(row.original.reviewMetrics?.payout ?? row.original.reviewPayout)} ${getActiveCollateralProfile(row.original.chainId).primary.symbol}`
                                : "Depends on settlement rules"}
                            </b>
                          </span>
                          <span>
                            Settlement
                            <b>
                              {row.original.marketStatus === MarketStatus.CLOSED
                                ? "Resolved"
                                : "Open · not yet redeemable"}
                            </b>
                          </span>
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
  review = false,
}: {
  review?: boolean;
  data: ReviewPosition[];
  chainId: PortfolioChainId;
  account: Address | undefined;
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
      showRedeemColumn={showRedeemColumn && !review}
      review={review}
    />
  );
}
