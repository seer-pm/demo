import React from "react";

import { AirdropTokenInfo } from "@/hooks/airdrop/useGetListAirdropTokens";
import { useMarketImages } from "@/hooks/useMarketImages";
import { SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
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
import { navigate } from "vike/client/router";
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

export default function AirdropTable({ data, chainId }: { data: AirdropTokenInfo[]; chainId: SupportedChain }) {
  const columns = React.useMemo<ColumnDef<AirdropTokenInfo>[]>(
    () => [
      {
        accessorKey: "tokenName",
        id: "tokenName",
        cell: (info) => {
          return <p className="text-[14px] whitespace-nowrap">{info.getValue<string>()}</p>;
        },
        header: "Token Name",
        enableSorting: true,
      },
      {
        accessorKey: "outcome",
        id: "outcome",
        cell: (info) => {
          return <p className="text-[14px] whitespace-nowrap">{info.getValue<string>() ?? "-"}</p>;
        },
        header: "Outcome Name",
        enableSorting: true,
      },
      {
        accessorKey: "airdropAmount",
        id: "airdropAmount",
        cell: (info) => {
          return <p className="text-[14px] whitespace-nowrap">{info.getValue<number>()}</p>;
        },
        header: "Airdrop Amount",
        enableSorting: true,
      },
      {
        accessorKey: "marketName",
        cell: (info) => {
          const position = info.row.original;
          if (!position.marketName) {
            return <p className="text-[14px]">-</p>;
          }
          return (
            <div className="flex gap-2 items-center text-[14px]">
              <MarketImage
                marketAddress={position.marketAddress as Address}
                marketName={position.marketName}
                chainId={chainId as SupportedChain}
              />
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={50} />
            </div>
          );
        },
        header: "Market Name",
        enableSorting: true,
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
              const rowData = row.original;
              if (!rowData.marketAddress || !rowData.outcome) {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
                    })}
                  </tr>
                );
              }
              return (
                <tr
                  key={row.id}
                  className="hover:bg-gray-light cursor-pointer"
                  onClick={() =>
                    navigate(
                      `${paths.market(rowData.marketAddress!, chainId)}?outcome=${toSnakeCase(rowData.outcome!)}`,
                    )
                  }
                >
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