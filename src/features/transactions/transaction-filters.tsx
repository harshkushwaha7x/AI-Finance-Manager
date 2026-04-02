"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TransactionCategoryOption, TransactionFilters } from "@/types/finance";

type TransactionFiltersProps = {
  filters: TransactionFilters;
  categories: TransactionCategoryOption[];
  onFiltersChange: (filters: TransactionFilters) => void;
  onReset: () => void;
};

export function TransactionFiltersPanel({
  filters,
  categories,
  onFiltersChange,
  onReset,
}: TransactionFiltersProps) {
  return (
    <Card className="rounded-[1.8rem]">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Filters</p>
          <CardTitle className="mt-3">Refine the live ledger before exports and review</CardTitle>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Status" htmlFor="transaction-status-filter">
          <Select
            id="transaction-status-filter"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value as TransactionFilters["status"],
              })
            }
          >
            <option value="all">All statuses</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
          </Select>
        </FormField>
        <FormField label="Category" htmlFor="transaction-category-filter">
          <Select
            id="transaction-category-filter"
            value={filters.category}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: event.target.value,
              })
            }
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.label}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="From" htmlFor="transaction-date-from">
          <Input
            id="transaction-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                dateFrom: event.target.value,
              })
            }
          />
        </FormField>
        <FormField label="To" htmlFor="transaction-date-to">
          <Input
            id="transaction-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                dateTo: event.target.value,
              })
            }
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
