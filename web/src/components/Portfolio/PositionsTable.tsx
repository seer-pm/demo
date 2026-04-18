import React, { useState } from "react";

import { useModal } from "@/hooks/useModal";
import {
  ArrowDropDown,
  ArrowDropUp,
  ArrowSwap,
  CloseIcon,
  ConditionalMarketIcon,
  QuestionIcon,
  SubDirArrowRight,
} from "@/lib/icons";
import { paths } from "@/lib/paths";
import { useMarket } from "@seer-pm/react";
import type { PortfolioPosition } from "@seer-pm/sdk";
import type { SupportedChain } from "@seer-pm/sdk";
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
import clsx from "clsx";
import { Address, isAddressEqual, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import { MarketImage } from "../Market/MarketImage";
import MarketsPagination from "../Market/MarketsPagination";
import { OutcomeImage } from "../Market/OutcomeImage";
import { RedeemForm } from "../Market/RedeemForm";
import Popover from "../Popover";

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
}: {
  data: PortfolioPosition[];
  chainId: SupportedChain;
  account: Address | undefined;
  showRedeemColumn: boolean;
}) {
  const { Modal, openModal, closeModal } = useModal("redeem-modal");
  const [selectedMarketId, setSelectedMarketId] = useState<Address>(zeroAddress);
  function formatSmallNumber(n: number | undefined) {
    if (typeof n !== "number") return "-";
    if (n === 0) return "0";
    if (Math.abs(n) < 0.01) {
      return n.toFixed(6).replace(/\.?0+$/, "");
    }

    return n.toFixed(2);
  }
  const columns = React.useMemo<ColumnDef<PortfolioPosition>[]>(() => {
    const redeemColumn: ColumnDef<PortfolioPosition> = {
      accessorKey: "marketStatus",
      cell: (info) => {
        const position = info.row.original;
        if (info.getValue<string>() === MarketStatus.CLOSED) {
          return (
            <button
              type="button"
              className="items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-[4px] bg-purple-primary text-white text-[14px] px-4 py-[6px]"
              onClick={() => {
                setSelectedMarketId(position.marketId);
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
          return (
            <div className="w-[100%] flex gap-1">
              {position.parentMarketId && (
                <Popover
                  trigger={
                    <div title="Conditional Market">
                      <ConditionalMarketIcon width="24" fill="#9747ff" />
                    </div>
                  }
                  content={
                    <p className="text-base-content/70 text-[14px]">
                      Conditional on{" "}
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline text-purple-primary cursor-pointer hover:underline"
                        href={`${paths.market(
                          position.parentMarketId!,
                          chainId,
                        )}?outcome=${encodeURIComponent(position.parentOutcome!)}`}
                      >
                        "{position.parentMarketName}"
                      </a>{" "}
                      being <span className="text-base-content">"{position.parentOutcome}"</span>
                    </p>
                  }
                />
              )}
              <div className="w-[100%]">
                <a
                  className="flex gap-2 items-center text-[13px] hover:underline cursor-pointer"
                  href={`${paths.market(position.marketId, chainId)}?outcome=${encodeURIComponent(position.outcome)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MarketImage marketAddress={position.marketId} chainId={chainId as SupportedChain} />
                  <p title={info.getValue<string>()} className="truncate">
                    {info.getValue<string>()}
                  </p>
                </a>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <SubDirArrowRight />
                  </div>
                  <OutcomeImage
                    image={position.outcomeImage}
                    title={position.outcome}
                    isInvalidOutcome={position.isInvalidOutcome}
                    className="w-[24px] h-[24px] rounded-full"
                  />
                  <p className="text-[13px] truncate">
                    <span className="text-purple-primary font-semibold">
                      {formatSmallNumber(position.tokenBalance)}{" "}
                    </span>
                    <span title={position.outcome}>{position.outcome}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        },
        header: "Market",
      },

      {
        accessorKey: "tokenPrice",
        cell: (info) => {
          const position = info.row.original;
          if (position.redeemedPrice) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2 justify-center">
                <p>{formatSmallNumber(position.redeemedPrice)}</p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[120px]">Redeem price</p>
                  <QuestionIcon fill="#9747FF" />
                </span>
              </div>
            );
          }
          if (position.parentMarketId) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2 justify-center">
                <p>{formatSmallNumber(info.getValue<number>())}</p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[300px]">
                    = relative price to parent outcome &times; parent's sDAI price
                  </p>
                  <QuestionIcon fill="#9747FF" />
                </span>
              </div>
            );
          }
          return <p className="font-semibold text-[14px] text-center">{formatSmallNumber(info.getValue<number>())}</p>;
        },
        header: "Price (sDAI)",
      },

      {
        accessorKey: "tokenValue",
        cell: (info) => (
          <p className="font-semibold text-[14px] text-center">{formatSmallNumber(info.getValue<number>())}</p>
        ),
        header: "Value (sDAI)",
      },
      ...(showRedeemColumn ? [redeemColumn] : []),
    ];
  }, [chainId, showRedeemColumn]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    initialState: {
      sorting: [
        {
          id: showRedeemColumn ? "marketStatus" : "marketName",
          desc: false,
        },
      ],
    },
  });

  return (
    <>
      <div className="w-full overflow-x-auto mb-6">
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
                  chainId={chainId}
                  closeModal={closeModal}
                />
              </div>
            }
            className="[&_.btn-primary]:w-full"
          />
        )}
        <table className="simple-table table-fixed">
          <colgroup>
            {showRedeemColumn ? (
              <>
                <col style={{ width: "46%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "24%" }} />
              </>
            ) : (
              <>
                <col style={{ width: "52%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "24%" }} />
              </>
            )}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan} className={index > 0 ? "text-center" : ""}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={clsx(
                            header.column.getCanSort() ? "cursor-pointer select-none" : "",
                            "flex items-center gap-2",
                            index > 0 ? "justify-center" : "",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          title={
                            header.column.getCanSort()
                              ? header.column.getNextSortingOrder() === "asc"
                                ? "Sort ascending"
                                : header.column.getNextSortingOrder() === "desc"
                                  ? "Sort descending"
                                  : "Clear sort"
                              : undefined
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <div className="flex-shrink-0">
                            {{
                              asc: <ArrowDropUp fill="currentColor" />,
                              desc: <ArrowDropDown fill="currentColor" />,
                              false: header.column.getCanSort() && <ArrowSwap />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td className="text-center" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MarketsPagination
        pageCount={table.getPageCount()}
        handlePageClick={({ selected }) => table.setPageIndex(selected)}
        page={table.getState().pagination.pageIndex + 1}
      />
    </>
  );
}

export default function PositionsTable({
  data,
  chainId,
  account,
}: {
  data: PortfolioPosition[];
  chainId: SupportedChain;
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
      showRedeemColumn={showRedeemColumn}
    />
  );
}
