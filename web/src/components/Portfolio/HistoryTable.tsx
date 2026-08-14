import React from "react";

import { DEFAULT_CHAIN, SUPPORTED_CHAINS } from "@/lib/chains";
import { NETWORK_ICON_MAPPING } from "@/lib/config";
import { ExternalLinkIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance } from "@/lib/utils";
import type { PortfolioChainId, SupportedChain, TransactionData } from "@seer-pm/sdk";
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Address, parseUnits } from "viem";
import { MarketImage } from "../Market/MarketImage";
import MarketsPagination from "../Market/MarketsPagination";
import TextOverflowTooltip from "../TextOverflowTooltip";
import { SortableColumnHeader } from "./SortableColumnHeader";

function txChainId(tx: TransactionData, filter: PortfolioChainId): SupportedChain {
  if (tx.chainId) return tx.chainId;
  if (filter !== "all") return filter;
  return DEFAULT_CHAIN;
}

function txExplorerHref(tx: TransactionData, filter: PortfolioChainId): string | undefined {
  if (!tx.transactionHash) return undefined;
  const explorerUrl = SUPPORTED_CHAINS[txChainId(tx, filter)]?.blockExplorers?.default?.url;
  return explorerUrl ? `${explorerUrl}/tx/${tx.transactionHash}` : undefined;
}

function TxDescriptionBody({ tx }: { tx: TransactionData }) {
  switch (tx.type) {
    case "split": {
      return tx.collateralSymbol ? (
        <span>
          Split from{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amount ?? "0n"), 18)} {tx.collateralSymbol}
          </span>{" "}
          to outcome tokens
        </span>
      ) : (
        <span>
          Split to <span className="font-semibold">{displayBalance(BigInt(tx.amount ?? "0n"), 18)}</span> outcome tokens
        </span>
      );
    }
    case "merge": {
      return (
        <span>
          Merge <span className="font-semibold">{displayBalance(BigInt(tx.amount ?? "0n"), 18)}</span> outcome tokens
          {tx.collateralSymbol ? ` to ${tx.collateralSymbol}` : ""}
        </span>
      );
    }
    case "redeem": {
      return (
        <span>
          Redeem <span className="font-semibold">{displayBalance(BigInt(tx.payout ?? "0n"), 18)}</span>{" "}
          {tx.collateralSymbol ?? ""}
        </span>
      );
    }
    case "swap": {
      return (
        <span>
          Swap{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amountIn ?? "0n"), 18)} {tx.tokenInSymbol}
          </span>{" "}
          for{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amountOut ?? "0n"), 18)} {tx.tokenOutSymbol}
          </span>
        </span>
      );
    }
    case "lp": {
      return (
        <span>
          Add{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amount0 ?? "0n"), 18)} {tx.token0Symbol}
          </span>{" "}
          and{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amount1 ?? "0n"), 18)} {tx.token1Symbol}
          </span>{" "}
          to the pool
        </span>
      );
    }
    case "lp-burn": {
      return (
        <span>
          Remove{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amount0 ?? "0n"), 18)} {tx.token0Symbol}
          </span>{" "}
          and{" "}
          <span className="font-semibold">
            {displayBalance(BigInt(tx.amount1 ?? "0n"), 18)} {tx.token1Symbol}
          </span>{" "}
          from the pool
        </span>
      );
    }
    case "bought": {
      return (
        <span>
          Bought{" "}
          <span className="font-semibold">{displayBalance(parseUnits((tx.amount ?? "0") as `${string}`, 18), 18)}</span>{" "}
          outcome tokens
        </span>
      );
    }
    case "sold": {
      return (
        <span>
          Sold{" "}
          <span className="font-semibold">{displayBalance(parseUnits((tx.amount ?? "0") as `${string}`, 18), 18)}</span>{" "}
          outcome tokens
        </span>
      );
    }
    default:
      return "—";
  }
}

function TxDescription({ tx, chainId }: { tx: TransactionData; chainId: PortfolioChainId }) {
  const href = txExplorerHref(tx, chainId);
  const body = (
    <>
      <TxDescriptionBody tx={tx} />
    </>
  );

  if (!href) {
    return <p className="text-[14px] text-pretty max-w-[28rem]">{body}</p>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1.5 text-[14px] text-pretty max-w-[28rem] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-primary"
    >
      {body}
      <span className="sr-only"> View on block explorer</span>
      <span className="text-purple-primary shrink-0 mt-0.5" aria-hidden>
        <ExternalLinkIcon fill="currentColor" />
      </span>
    </a>
  );
}

export default function HistoryTable({ data, chainId }: { data: TransactionData[]; chainId: PortfolioChainId }) {
  const showChain = chainId === "all";
  const columns = React.useMemo<ColumnDef<TransactionData>[]>(
    () => [
      {
        accessorKey: "marketName",
        cell: (info) => {
          const data = info.row.original;
          const rowChainId = txChainId(data, chainId);
          const chainName = SUPPORTED_CHAINS[rowChainId as keyof typeof SUPPORTED_CHAINS]?.name;
          return (
            <a
              className="flex gap-2 items-center text-[14px] hover:underline cursor-pointer min-w-0"
              href={`${paths.market(data.marketId, rowChainId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MarketImage marketAddress={data.marketId as Address} chainId={rowChainId} />
              <span className="min-w-0">
                <TextOverflowTooltip text={info.getValue<string>()} maxChar={40} />
              </span>
              {showChain && NETWORK_ICON_MAPPING[rowChainId] ? (
                <img
                  alt={chainName ?? String(rowChainId)}
                  title={chainName}
                  className="w-4 h-4 rounded-full shrink-0"
                  src={NETWORK_ICON_MAPPING[rowChainId]}
                />
              ) : null}
            </a>
          );
        },
        header: "Market",
      },
      {
        id: "description",
        cell: (info) => <TxDescription tx={info.row.original} chainId={chainId} />,
        header: "Description",
        enableSorting: false,
      },
      {
        accessorKey: "timestamp",
        cell: (info) => {
          const data = info.row.original;
          return (
            <time
              className="text-[14px] whitespace-nowrap"
              dateTime={data.timestamp ? new Date(data.timestamp * 1000).toISOString() : undefined}
            >
              {data.timestamp ? format(data.timestamp * 1000, "MMM d, yyyy, h:mm a") : "—"}
            </time>
          );
        },
        header: "Date",
      },
    ],
    [chainId, showChain],
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
                      <SortableColumnHeader header={header} />
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
