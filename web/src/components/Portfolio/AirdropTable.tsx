import React from "react";

import { AirdropDataByUser } from "@/hooks/airdrop/useGetAirdropDataByUser";
import { ArrowDropDown, ArrowDropUp, ArrowSwap, QuestionIcon } from "@/lib/icons";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useAccount } from "wagmi";
import Tooltip from "../Tooltip";

export default function AirdropTable({ data }: { data: AirdropDataByUser[] }) {
  const { address } = useAccount();
  const columns = React.useMemo<ColumnDef<AirdropDataByUser>[]>(
    () => [
      // {
      //   accessorKey: "currentWeekAllocation",
      //   cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
      //   header: () => (
      //     <span>
      //       Current Week Allocation (SEER){" "}
      //       <span className="font-normal text-black-secondary text-[12px]">
      //         <br />
      //         (Estimated)
      //       </span>
      //     </span>
      //   ),
      //   enableSorting: false,
      // },
      {
        accessorKey: "monthlyEstimate",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>()?.toLocaleString()}</p>,
        header: () => (
          <span>
            Monthly Holding Allocation (SEER){" "}
            <span className="font-normal text-black-secondary text-[12px]">
              <br />
              (Estimated)
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "monthlyEstimatePoH",
        cell: (info) => {
          if (!info.getValue<number>()) {
            return (
              <div className="flex items-center gap-2">
                <p className="text-[14px]">0</p>
                <Tooltip
                  trigger={<QuestionIcon fill="#9747FF" />}
                  content={
                    <div className="text-[14px] flex flex-col gap-2 p-4">
                      <p>Register Proof of Humanity for additional SEER allocation.</p>
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-fit items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-[4px] bg-purple-primary text-white text-[14px] px-4 py-[6px]"
                        href={
                          address
                            ? `https://v2.proofofhumanity.id/${address.replace(/^0x/, "")}/claim`
                            : "`https://v2.proofofhumanity.id"
                        }
                      >
                        Register
                      </a>
                    </div>
                  }
                />
              </div>
            );
          }
          return <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>;
        },
        header: () => (
          <span>
            Monthly PoH Allocation (SEER){" "}
            <span className="font-normal text-black-secondary text-[12px]">
              <br />
              (Estimated)
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "outcomeTokenHoldingAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: () => (
          <span>
            Total Holding Allocation (SEER){" "}
            <span className="font-normal text-black-secondary text-[12px]">
              <br />
              (Estimated)
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "pohUserAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: () => (
          <span>
            Total PoH Allocation (SEER){" "}
            <span className="font-normal text-black-secondary text-[12px]">
              <br />
              (Estimated)
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "totalAllocation",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: () => (
          <span>
            Total Allocation (SEER){" "}
            <span className="font-normal text-black-secondary text-[12px]">
              <br />
              (Estimated)
            </span>
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "serLppMainnet",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Liquidity (Mainnet)",
        enableSorting: false,
      },
      {
        accessorKey: "serLppGnosis",
        cell: (info) => <p className="text-[14px]">{info.getValue<number>().toLocaleString()}</p>,
        header: "Liquidity (Gnosis)",
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
                    <th key={header.id} colSpan={header.colSpan} className="align-top">
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
