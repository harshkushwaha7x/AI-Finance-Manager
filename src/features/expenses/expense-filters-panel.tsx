"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ExpensePageFilters } from "@/types/expenses";
import type { TransactionCategoryOption } from "@/types/finance";

type ExpenseFiltersPanelProps = {
  filters: ExpensePageFilters;
  categories: TransactionCategoryOption[];
  onFiltersChange: (filters: ExpensePageFilters) => void;
  onReset: () => void;
};

export function ExpenseFiltersPanel({
  filters,
  categories,
  onFiltersChange,
  onReset,
}: ExpenseFiltersPanelProps) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Expense filters</p>
          <CardTitle className="mt-3">
            Slice the spend data before export and review
          </CardTitle>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <FormField label="Category" htmlFor="expense-category-filter">
          <Select
            id="expense-category-filter"
            value={filters.category}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: event.target.value,
              })
            }
          >
            <option value="all">All expense categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.label}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="From" htmlFor="expense-date-from">
          <Input
            id="expense-date-from"
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
        <FormField label="To" htmlFor="expense-date-to">
          <Input
            id="expense-date-to"
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
