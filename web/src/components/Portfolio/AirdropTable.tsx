import React from "react";

import { AirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { ArrowDropDown, ArrowDropUp, ArrowSwap } from "@/lib/icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";

export default function AirdropTable({ data }: { data: AirdropDataByUser[] }) {
  const columns = React.useMemo<ColumnDef<AirdropDataByUser>[]>(
    () => [
      {
        accessorKey: "currentWeekAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Current Week Allocation (SEER)",
        enableSorting: false,
      },
      {
        accessorKey: "outcomeTokenHoldingAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Total Outcome Token Holding Allocation (SEER)",
        enableSorting: false,
      },
      {
        accessorKey: "pohUserAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Total Proof of Humanity Allocation (SEER)",
        enableSorting: false,
      },
      {
        accessorKey: "totalAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Total Allocation (SEER)",
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    </>
  );
}
