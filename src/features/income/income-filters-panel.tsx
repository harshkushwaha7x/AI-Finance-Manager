"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { IncomePageFilters } from "@/types/income";
import type { TransactionCategoryOption, TransactionRecord } from "@/types/finance";

type IncomeFiltersPanelProps = {
  filters: IncomePageFilters;
  categories: TransactionCategoryOption[];
  onFiltersChange: (filters: IncomePageFilters) => void;
  onReset: () => void;
};

const sourceOptions: Array<{
  label: string;
  value: IncomePageFilters["source"];
}> = [
  { label: "All sources", value: "all" },
  { label: "Manual entry", value: "manual" },
  { label: "Invoice linked", value: "invoice" },
  { label: "AI import", value: "ai" },
  { label: "Receipt import", value: "receipt" },
];

export function IncomeFiltersPanel({
  filters,
  categories,
  onFiltersChange,
  onReset,
}: IncomeFiltersPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Income filters</p>
          <CardTitle className="mt-3">Slice incoming cash before reporting and follow-up</CardTitle>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormField label="Category" htmlFor="income-category-filter">
          <Select
            id="income-category-filter"
            value={filters.category}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: event.target.value,
              })
            }
          >
            <option value="all">All income categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.label}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Source" htmlFor="income-source-filter">
          <Select
            id="income-source-filter"
            value={filters.source}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                source: event.target.value as TransactionRecord["source"] | "all",
              })
            }
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="From" htmlFor="income-date-from">
          <Input
            id="income-date-from"
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
        <FormField label="To" htmlFor="income-date-to">
          <Input
            id="income-date-to"
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
