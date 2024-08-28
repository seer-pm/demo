import React from "react";

import { useMarketImages } from "@/hooks/useMarketImages";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { PortfolioPosition } from "@/hooks/usePortfolioPositions";
import { SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { Address } from "viem";
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

export default function PortfolioTable({ data, chainId }: { data: PortfolioPosition[]; chainId: SupportedChain }) {
  const navigate = useNavigate();
  const columns = React.useMemo<ColumnDef<PortfolioPosition>[]>(
    () => [
      {
        accessorKey: "marketName",
        cell: (info) => {
          const position = info.row.original;
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
      },
      {
        accessorFn: (position) => `${position.tokenBalance.toFixed(2)} ${position.tokenName}`,
        id: "position",
        cell: (info) => <p className="text-purple-primary font-semibold text-[14px]">{info.getValue<string>()}</p>,
        header: "Position",
        enableSorting: false,
      },
      {
        accessorKey: "tokenPrice",
        cell: (info) => <p className="font-semibold text-[14px]">{info.getValue<number>()?.toFixed(2) ?? "-"}</p>,
        header: "Current Token Price (per sDAI)",
      },
      {
        accessorKey: "tokenValue",
        cell: (info) => <p className="font-semibold text-[14px]">{info.getValue<number>()?.toFixed(2) ?? "-"}</p>,
        header: "Position Value (sDAI)",
      },
      {
        accessorFn: (position) => (position.marketStatus === MarketStatus.CLOSED ? "Redeemable" : "Not yet"),
        cell: (info) => (
          <p
            className={clsx(
              "text-[14px]",
              info.row.original.marketStatus === MarketStatus.CLOSED ? "text-success-primary" : "text-black-secondary",
            )}
          >
            {info.getValue<string>()}
          </p>
        ),
        header: "Redeem Status",
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), //client-side sorting
  });

  return (
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
                      {{
                        asc: <ArrowDropUp fill="currentColor" />,
                        desc: <ArrowDropDown fill="currentColor" />,
                        false: header.column.getCanSort() && <ArrowSwap />,
                      }[header.column.getIsSorted() as string] ?? null}
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
            <tr
              className="cursor-pointer hover:bg-white"
              key={row.id}
              onClick={() => {
                const position = row.original;
                navigate(`${paths.market(position.marketAddress, chainId)}?outcome=${position.tokenIndex}`);
              }}
            >
              {row.getVisibleCells().map((cell) => {
                return <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
