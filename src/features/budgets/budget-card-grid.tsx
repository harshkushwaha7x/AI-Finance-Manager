"use client";

import { PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatBudgetPeriodLabel,
  formatBudgetStatusLabel,
  getBudgetStatusVariant,
} from "@/features/budgets/budget-utils";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import { cn } from "@/lib/utils";
import type { BudgetRecord } from "@/types/finance";

type BudgetCardGridProps = {
  budgets: BudgetRecord[];
  activeBudgetId?: string | null;
  onSelect: (budget: BudgetRecord) => void;
  onEdit: (budget: BudgetRecord) => void;
  onDelete: (budget: BudgetRecord) => void;
};

export function BudgetCardGrid({
  budgets,
  activeBudgetId,
  onSelect,
  onEdit,
  onDelete,
}: BudgetCardGridProps) {
  if (!budgets.length) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
        <p className="font-display text-2xl font-bold text-foreground">No budgets match these filters</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Reset the current view or create a new budget to bring planning cards back into focus.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {budgets.map((budget) => {
        const progressWidth = Math.min(100, Math.max(6, budget.utilizationPercent));

        return (
          <Card
            key={budget.id}
            className={cn(
              "overflow-hidden rounded-[1.8rem] border transition",
              activeBudgetId === budget.id
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-black/6",
            )}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: budget.categoryColor ?? "#94a3b8" }}
            />
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{budget.categoryLabel}</p>
                  <CardTitle className="mt-3">{budget.name}</CardTitle>
                </div>
                <Badge variant={getBudgetStatusVariant(budget.status)}>
                  {formatBudgetStatusLabel(budget.status)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{formatBudgetPeriodLabel(budget.period)}</Badge>
                {budget.carryForward ? <Badge variant="secondary">Carry forward</Badge> : null}
                <Badge variant="secondary">{budget.alertPercent}% alert</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted">Used</span>
                  <span className="font-semibold text-foreground">
                    {Math.round(budget.utilizationPercent)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/6">
                  <div
                    className={`h-full rounded-full ${
                      budget.status === "over"
                        ? "bg-danger"
                        : budget.status === "watch"
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Limit</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(budget.limitAmount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Spent</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(budget.spentAmount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Left</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(budget.remainingAmount)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <p>
                  {budget.daysRemaining} day{budget.daysRemaining === 1 ? "" : "s"} left in this
                  budget window.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(budget)}>
                    Focus
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(budget)}>
                    <PencilLine className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(budget)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
