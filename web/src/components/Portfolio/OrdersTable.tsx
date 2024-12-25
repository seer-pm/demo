import React from "react";

import { CowOrderData } from "@/hooks/portfolio/ordersTab/types";
import { useMarketImages } from "@/hooks/useMarketImages";
import { SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
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
import { format } from "date-fns";
import { Address } from "viem";
import { CopyButton } from "../CopyButton";
import MarketsPagination from "../Market/MarketsPagination";
import TextOverflowTooltip from "../TextOverflowTooltip";

export function MarketImage({
  marketAddress,
  marketName,
  chainId,
}: {
  marketAddress: Address;
  marketName: string;
  chainId: SupportedChain;
}) {
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

export default function OrdersTable({ data, chainId }: { data: CowOrderData[]; chainId: SupportedChain }) {
  const columns = React.useMemo<ColumnDef<CowOrderData>[]>(
    () => [
      {
        accessorKey: "uid",
        cell: (info) => {
          return (
            <div className="flex items-center gap-2">
              <a
                className="text-[14px] hover:underline cursor-pointer whitespace-nowrap"
                href={`https://explorer.cow.fi/gc/orders/${info.getValue<string>()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {info.getValue<string>().slice(0, 12)}...
              </a>
              <CopyButton textToCopy={info.getValue<string>()} size={18} />
            </div>
          );
        },
        header: "Order Id",
        enableSorting: false,
      },
      {
        accessorKey: "marketName",
        cell: (info) => {
          const data = info.row.original;
          return (
            <a
              className="flex gap-2 items-center text-[14px] hover:underline cursor-pointer whitespace-nowrap"
              href={`${paths.market(data.marketId, chainId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MarketImage
                marketAddress={data.marketId as Address}
                marketName={data.marketName}
                chainId={chainId as SupportedChain}
              />
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={20} isUseTitle />
            </a>
          );
        },
        header: "Market Name",
      },
      {
        accessorFn: (order) => `${order.sellAmount} ${order.sellTokenSymbol}`,
        cell: (info) => {
          return <div className="text-[14px] whitespace-nowrap">{info.getValue<string>()}</div>;
        },
        header: "Sell Amount",
        enableSorting: false,
      },
      {
        accessorFn: (order) => `${order.buyAmount} ${order.buyTokenSymbol}`,
        cell: (info) => {
          return <div className="text-[14px] whitespace-nowrap">{info.getValue<string>()}</div>;
        },
        header: "Buy Amount",
        enableSorting: false,
      },
      {
        accessorFn: (order) => `${order.limitPrice} ${order.sellTokenSymbol}`,
        cell: (info) => {
          return <div className="text-[14px] whitespace-nowrap">{info.getValue<string>()}</div>;
        },
        header: "Limit Price",
        enableSorting: false,
      },
      {
        accessorKey: "creationDate",
        cell: (info) => {
          return (
            <div className="text-[14px] whitespace-nowrap">
              {format(info.getValue<string>(), "yyyy-MM-dd HH:mm:ss z")}
            </div>
          );
        },
        header: "Creation Date",
      },
      {
        accessorKey: "status",
        cell: (info) => {
          return (
            <div
              className={clsx(
                "text-[14px] whitespace-nowrap font-semibold text-black-secondary",
                {
                  fulfilled: "text-success-primary",
                  open: "text-purple-primary",
                  presignaturePending: "text-tint-blue-primary",
                  cancelled: "text-black-secondary",
                  expired: "text-warning-primary",
                }[info.getValue<string>()],
              )}
            >
              {info.getValue<string>().toUpperCase()}
            </div>
          );
        },
        header: "Status",
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
