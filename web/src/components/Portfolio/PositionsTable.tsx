import React from "react";

import { PortfolioPosition } from "@/hooks/portfolio/positionsTab/usePortfolioPositions";
import { useMarketImages } from "@/hooks/useMarketImages";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, ArrowSwap, QuestionIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { toSnakeCase } from "@/lib/utils";
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
import { Address } from "viem";
import MarketsPagination from "../Market/MarketsPagination";
import TextOverflowTooltip from "../TextOverflowTooltip";

export function MarketImage({
  marketAddress,
  marketName,
  chainId,
}: { marketAddress: Address; marketName: string; chainId: SupportedChain }) {
  const { data: images } = useMarketImages(marketAddress, chainId);
  return (
    <div>
      {images?.market ? (
        <img
          src={images.market}
          alt={marketName}
          className="w-[40px] h-[40px] min-w-[40px] min-h-[40px] rounded-full"
        />
      ) : (
        <div className="w-[40px] h-[40px] rounded-full bg-purple-primary"></div>
      )}
    </div>
  );
}

export default function PositionsTable({ data, chainId }: { data: PortfolioPosition[]; chainId: SupportedChain }) {
  const columns = React.useMemo<ColumnDef<PortfolioPosition>[]>(
    () => [
      {
        accessorKey: "marketName",
        cell: (info) => {
          const position = info.row.original;
          return (
            <a
              className="flex gap-2 items-center text-[14px] hover:underline cursor-pointer"
              href={`${paths.market(position.marketAddress, chainId)}?outcome=${toSnakeCase(position.outcome)}`}
            >
              <MarketImage
                marketAddress={position.marketAddress as Address}
                marketName={position.marketName}
                chainId={chainId as SupportedChain}
              />
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={50} />
            </a>
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
              className="flex text-[14px] cursor-pointer hover:underline"
              href={`${paths.market(position.parentMarketId!, chainId)}?outcome=${toSnakeCase(position.parentOutcome!)}`}
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
              href={`${paths.market(position.marketAddress, chainId)}?outcome=${toSnakeCase(position.outcome)}`}
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
              <a
                className="text-[14px] text-success-primary cursor-pointer"
                href={`${paths.market(position.marketAddress, chainId)}?outcome=${toSnakeCase(position.outcome)}`}
              >
                Redeemable
              </a>
            );
          }
          return <p className="text-[14px] text-black-secondary">Not yet</p>;
        },
        header: "Redeem Status",
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
  });

  return (
    <>
      <div className="w-full overflow-x-auto mb-6">
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
