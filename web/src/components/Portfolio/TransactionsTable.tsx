import React from "react";

import { TransactionData } from "@/hooks/portfolio/useHistoryTransactions";
import { useMarketImages } from "@/hooks/useMarketImages";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import clsx from "clsx";
import { format } from "date-fns";
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

export default function TransactionsTable({ data, chainId }: { data: TransactionData[]; chainId: SupportedChain }) {
  const navigate = useNavigate();
  const columns = React.useMemo<ColumnDef<TransactionData>[]>(
    () => [
      {
        accessorKey: "type",
        cell: (info) => {
          return (
            <div className="font-semibold text-[14px] flex items-center gap-2 whitespace-nowrap">
              <p>
                {info.getValue<string>()
                  ? { split: "Split", merge: "Merge", redeem: "Redeem", swap: "Swap", lp: "Liquidity Providing" }[
                      info.getValue<string>()
                    ]
                  : "-"}
              </p>
            </div>
          );
        },
        header: "Type",
      },
      {
        accessorKey: "marketName",
        cell: (info) => {
          const data = info.row.original;
          return (
            <div
              className="flex gap-2 items-center text-[14px] hover:underline cursor-pointer whitespace-nowrap"
              onClick={() => {
                navigate(`${paths.market(data.marketId, chainId)}`);
              }}
            >
              <MarketImage
                marketAddress={data.marketId as Address}
                marketName={data.marketName}
                chainId={chainId as SupportedChain}
              />
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={50} />
            </div>
          );
        },
        header: "Market Name",
      },
      {
        cell: (info) => {
          const data = info.row.original;
          switch (data.type) {
            case "split": {
              return (
                <p className="text-[14px] min-w-[200px]">
                  {data.collateralSymbol ? (
                    <span>
                      Split from{" "}
                      <span className="font-semibold">
                        {displayBalance(BigInt(data.amount ?? "0n"), 18)} {data.collateralSymbol}
                      </span>{" "}
                      to outcome tokens
                    </span>
                  ) : (
                    <span>
                      Split to <span className="font-semibold">{displayBalance(BigInt(data.amount ?? "0n"), 18)}</span>{" "}
                      outcome tokens
                    </span>
                  )}
                  .
                </p>
              );
            }
            case "merge": {
              return (
                <p className="text-[14px]  min-w-[200px]">
                  Merge <span className="font-semibold">{displayBalance(BigInt(data.amount ?? "0n"), 18)}</span> outcome
                  tokens
                  {data.collateralSymbol ? ` to ${data.collateralSymbol}` : ""}.
                </p>
              );
            }
            case "redeem": {
              return (
                <p className="text-[14px] min-w-[200px]">
                  Redeem <span className="font-semibold">{displayBalance(BigInt(data.payout ?? "0n"), 18)}</span>{" "}
                  {data.collateralSymbol ?? ""}.
                </p>
              );
            }
            case "swap": {
              return (
                <p className="text-[14px] min-w-[200px]">
                  Swap{" "}
                  <span className="font-semibold">
                    {displayBalance(BigInt(data.amountIn ?? "0n"), 18)} {data.tokenInSymbol}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold">
                    {displayBalance(BigInt(data.amountOut ?? "0n"), 18)} {data.tokenOutSymbol}
                  </span>
                  .
                </p>
              );
            }
            case "lp": {
              return (
                <p className="text-[14px] min-w-[200px]">
                  Add{" "}
                  <span className="font-semibold">
                    {displayBalance(BigInt(data.amount0 ?? "0n"), 18)} {data.token0Symbol}
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold">
                    {displayBalance(BigInt(data.amount1 ?? "0n"), 18)} {data.token1Symbol}
                  </span>{" "}
                  to liquidity pool.
                </p>
              );
            }
          }
        },
        header: "Description",
      },
      {
        accessorKey: "timestamp",
        cell: (info) => {
          const data = info.row.original;
          return (
            <div className="text-[14px] whitespace-nowrap">
              {data.timestamp ? format(data.timestamp * 1000, "yyyy-MM-dd HH:mm:ss z") : "-"}
            </div>
          );
        },
        header: "Date",
      },
      {
        accessorKey: "transactionHash",
        cell: (info) => {
          const data = info.row.original;
          const blockExplorerUrl = SUPPORTED_CHAINS[chainId].blockExplorers?.default?.url;
          if (!data.transactionHash) return "-";
          return (
            <a
              href={blockExplorerUrl && `${blockExplorerUrl}/tx/${data.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold text-purple-primary"
            >
              <TextOverflowTooltip text={info.getValue<string>()} maxChar={20} />
            </a>
          );
        },
        header: "Transaction Hash",
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
  );
}
