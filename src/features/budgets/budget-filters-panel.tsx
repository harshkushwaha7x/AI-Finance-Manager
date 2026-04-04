"use client";

import { RotateCcw } from "lucide-react";

import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import type { TransactionCategoryOption } from "@/types/finance";
import type { BudgetPageFilters } from "@/types/budgets";

type BudgetFiltersPanelProps = {
  filters: BudgetPageFilters;
  categories: TransactionCategoryOption[];
  onFiltersChange: (filters: BudgetPageFilters) => void;
  onReset: () => void;
};

export function BudgetFiltersPanel({
  filters,
  categories,
  onFiltersChange,
  onReset,
}: BudgetFiltersPanelProps) {
  const expenseCategories = categories.filter((category) => category.kind === "expense");

  return (
    <Card className="h-full">
      <CardHeader>
        <SectionToolbar
          title="Budget filters"
          description="Narrow the planning view by category, cadence, or pressure state before you edit anything."
          actions={
            <Button variant="secondary" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField label="Category" htmlFor="budget-filter-category">
          <Select
            id="budget-filter-category"
            value={filters.category}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: event.target.value,
              })
            }
          >
            <option value="all">All categories</option>
            <option value="Uncategorized spend">Uncategorized spend</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.label}>
                {category.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Period" htmlFor="budget-filter-period">
          <Select
            id="budget-filter-period"
            value={filters.period}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                period: event.target.value,
              })
            }
          >
            <option value="all">All periods</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="budget-filter-status">
          <Select
            id="budget-filter-status"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value,
              })
            }
          >
            <option value="all">All statuses</option>
            <option value="healthy">Healthy</option>
            <option value="watch">Watch</option>
            <option value="over">Over budget</option>
          </Select>
        </FormField>
        <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
          Day 12 now calculates utilization from the live expense ledger, so the same budget card can react instantly as expenses are created, updated, or deleted.
        </div>
      </CardContent>
    </Card>
  );
}
