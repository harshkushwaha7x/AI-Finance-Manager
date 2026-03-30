"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SectionToolbar } from "@/components/shared/section-toolbar";

type FilterOption = {
  label: string;
  value: string;
};

type DataTableShellProps<TData> = {
  title: string;
  description?: string;
  data: TData[];
  columns: ColumnDef<TData>[];
  searchKey: keyof TData & string;
  searchPlaceholder?: string;
  filterKey?: keyof TData & string;
  filterLabel?: string;
  filterOptions?: FilterOption[];
  actions?: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
};

export function DataTableShell<TData>({
  title,
  description,
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search records",
  filterKey,
  filterLabel = "Filter",
  filterOptions = [],
  actions,
  emptyTitle,
  emptyDescription,
}: DataTableShellProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = String(row[searchKey] ?? "")
        .toLowerCase()
        .includes(searchValue.toLowerCase());

      if (!filterKey || filterValue === "all") {
        return matchesSearch;
      }

      return matchesSearch && String(row[filterKey] ?? "") === filterValue;
    });
  }, [data, filterKey, filterValue, searchKey, searchValue]);

  // TanStack Table manages internal function references that React Compiler can't safely memoize yet.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card>
      <CardHeader className="space-y-6">
        <SectionToolbar title={title} description={description} actions={actions} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="sm:max-w-sm"
            />
            {filterKey ? (
              <Select
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                className="sm:max-w-56"
              >
                <option value="all">{filterLabel}: All</option>
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {filteredData.length} record{filteredData.length === 1 ? "" : "s"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {table.getRowModel().rows.length ? (
          <>
            <div className="overflow-hidden rounded-[1.3rem] border border-black/6">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-subtle text-muted">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 font-medium">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-t border-black/6 bg-surface">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4 align-top text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">{emptyTitle}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{emptyDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
