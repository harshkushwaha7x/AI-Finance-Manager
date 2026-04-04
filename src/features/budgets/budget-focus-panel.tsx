"use client";

import { CalendarRange, Flag, Repeat, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatBudgetPeriodLabel,
  formatBudgetStatusLabel,
  getBudgetStatusVariant,
} from "@/features/budgets/budget-utils";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "@/features/transactions/transaction-utils";
import type { BudgetRecord } from "@/types/finance";

type BudgetFocusPanelProps = {
  budget: BudgetRecord | null;
};

export function BudgetFocusPanel({ budget }: BudgetFocusPanelProps) {
  if (!budget) {
    return (
      <Card className="h-full">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Focus budget</p>
          <CardTitle className="mt-3">Select a budget to inspect the planning context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6 text-sm leading-7 text-muted">
            Pick any budget card to review its utilization, time window, carry-forward behavior, and the exact remaining headroom.
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressWidth = Math.min(100, Math.max(6, budget.utilizationPercent));

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Focus budget</p>
            <CardTitle className="mt-3">{budget.name}</CardTitle>
            <p className="mt-3 text-sm leading-7 text-muted">
              {budget.categoryLabel} is currently running at {Math.round(budget.utilizationPercent)}% of the planned limit.
            </p>
          </div>
          <Badge variant={getBudgetStatusVariant(budget.status)}>
            {formatBudgetStatusLabel(budget.status)}
          </Badge>
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
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted">Budget limit</p>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatTransactionAmount(budget.limitAmount)}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-warning" />
            <p className="text-sm font-medium text-muted">Spent so far</p>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatTransactionAmount(budget.spentAmount)}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-4 w-4 text-secondary" />
            <p className="text-sm font-medium text-muted">Window</p>
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">
            {formatTransactionDate(budget.startDate)} to {formatTransactionDate(budget.endDate)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {formatBudgetPeriodLabel(budget.period)} cadence with {budget.daysRemaining} day
            {budget.daysRemaining === 1 ? "" : "s"} left.
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Repeat className="h-4 w-4 text-success" />
            <p className="text-sm font-medium text-muted">Carry forward</p>
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">
            {budget.carryForward ? "Enabled" : "Disabled"}
          </p>
          <p className="mt-2 text-sm text-muted">
            Alert threshold is set at {budget.alertPercent}% for this budget.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
