import React, { useState } from "react";

import { PortfolioPosition } from "@/hooks/portfolio/positionsTab/usePortfolioPositions";
import { useMarket } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useModal } from "@/hooks/useModal";
import { SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { ArrowDropDown, ArrowDropUp, ArrowSwap, CloseIcon, QuestionIcon, SubDirArrowRight } from "@/lib/icons";
import { paths } from "@/lib/paths";
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
import { Address, zeroAddress } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { MarketImage } from "../Market/MarketImage";
import MarketsPagination from "../Market/MarketsPagination";
import { OutcomeImage } from "../Market/OutcomeImage";
import { RedeemForm } from "../Market/RedeemForm";
import TextOverflowTooltip from "../TextOverflowTooltip";

function RedeemModalContent({
  account,
  router,
  marketId,
  chainId,
  closeModal,
}: {
  account?: Address;
  router: Address;
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
      <RedeemForm account={account} router={router} market={market} successCallback={() => closeModal()} />
    </div>
  );
}

export default function PositionsTable({ data, chainId }: { data: PortfolioPosition[]; chainId: SupportedChain }) {
  const { Modal, openModal, closeModal } = useModal("redeem-modal");
  const { address: account } = useAccount();
  const router = getRouterAddress(chainId);
  const [selectedMarketId, setSelectedMarketId] = useState<Address>(zeroAddress);
  const columns = React.useMemo<ColumnDef<PortfolioPosition>[]>(
    () => [
      {
        accessorKey: "marketName",
        cell: (info) => {
          const position = info.row.original;
          return (
            <div className="space-y-2">
              <a
                className="flex gap-2 items-center text-[13px] hover:underline cursor-pointer w-[350px]"
                href={`${paths.market(position.marketAddress, chainId)}?outcome=${encodeURIComponent(
                  position.outcome,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MarketImage marketAddress={position.marketAddress as Address} chainId={chainId as SupportedChain} />
                <p>{info.getValue<string>()}</p>
              </a>
              <div className="py-4 flex items-center gap-2">
                <SubDirArrowRight />
                <OutcomeImage
                  image={position.outcomeImage}
                  title={position.outcome}
                  isInvalidOutcome={position.isInvalidOutcome}
                  className="w-[30px] h-[30px] rounded-full"
                />
                <p className="text-[13px]">{position.outcome}</p>
              </div>
            </div>
          );
        },
        header: "Market Name",
      },
      {
        accessorFn: (position) => position.parentMarketName ?? "",
        id: "parentMarket",
        cell: (info) => {
          const position = info.row.original;
          if (!position.parentMarketId) return "-";
          return (
            <a
              className="flex text-[13px] cursor-pointer hover:underline"
              href={`${paths.market(position.parentMarketId!, chainId)}?outcome=${encodeURIComponent(
                position.parentOutcome!,
              )}`}
            >
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={30} />
            </a>
          );
        },
        header: "Parent Market",
        enableSorting: true,
      },
      {
        accessorFn: (position) => `${position.tokenBalance.toFixed(2)} ${position.tokenName}`,
        id: "position",
        cell: (info) => {
          const position = info.row.original;
          return (
            <a
              className="text-purple-primary font-semibold text-[14px] whitespace-nowrap cursor-pointer"
              href={`${paths.market(position.marketAddress, chainId)}?outcome=${encodeURIComponent(position.outcome)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {info.getValue<string>()}
            </a>
          );
        },
        header: "Position",
        enableSorting: false,
      },
      {
        accessorKey: "tokenPrice",
        cell: (info) => {
          const position = info.row.original;
          if (position.redeemedPrice) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2">
                <p>{info.getValue<number>()?.toFixed(2) ?? "-"}</p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[120px]">Redeem price</p>
                  <QuestionIcon fill="#9747FF" />
                </span>
              </div>
            );
          }
          if (position.parentMarketId) {
            return (
              <div className="font-semibold text-[14px] flex items-center gap-2">
                <p>{info.getValue<number>()?.toFixed(2) ?? "-"}</p>
                <span className="tooltip">
                  <p className="tooltiptext !whitespace-pre-wrap w-[300px]">
                    = relative price to parent outcome &times; parent's sDAI price
                  </p>
                  <QuestionIcon fill="#9747FF" />
                </span>
              </div>
            );
          }
          return <p className="font-semibold text-[14px]">{info.getValue<number>()?.toFixed(2) ?? "-"}</p>;
        },
        header: "Current Token Price (sDAI)",
      },

      {
        accessorKey: "tokenValue",
        cell: (info) => <p className="font-semibold text-[14px]">{info.getValue<number>()?.toFixed(2) ?? "-"}</p>,
        header: "Position Value (sDAI)",
      },
      {
        accessorKey: "marketStatus",
        cell: (info) => {
          const position = info.row.original;
          if (info.getValue<string>() === MarketStatus.CLOSED) {
            return (
              <Button
                type="button"
                text="Redeem"
                className="!min-w-[100px] !w-[100px] !min-h-[40px] !h-[40px]"
                onClick={() => {
                  setSelectedMarketId(position.marketAddress as Address);
                  openModal();
                }}
              >
                Redeemable
              </Button>
            );
          }
          return <p className="text-[14px] text-black-secondary">Not yet</p>;
        },
        header: "Redeem",
      },
    ],
    [],
  );
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
          id: "marketStatus",
          desc: false,
        },
      ],
    },
  });

  return (
    <>
      <div className="w-full overflow-x-auto mb-6">
        <Modal
          title="Redeem"
          content={
            <div>
              <button
                type="button"
                className="absolute right-[20px] top-[20px] hover:opacity-60"
                onClick={() => closeModal()}
              >
                <CloseIcon fill="black" />
              </button>
              <RedeemModalContent
                account={account}
                router={router}
                marketId={selectedMarketId as Address}
                chainId={chainId}
                closeModal={closeModal}
              />
            </div>
          }
          className="[&_.btn-primary]:w-full"
        />
        <table className="simple-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={clsx(
                            header.column.getCanSort() ? "cursor-pointer select-none" : "",
                            "flex items-center gap-2",
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
                    return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
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
