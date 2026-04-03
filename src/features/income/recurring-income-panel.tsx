"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionSourceLabel,
} from "@/features/transactions/transaction-utils";
import type { IncomeSummary } from "@/types/income";
import type { TransactionRecord } from "@/types/finance";

type RecurringIncomePanelProps = {
  recurringIncome: TransactionRecord[];
  summary: IncomeSummary;
};

export function RecurringIncomePanel({
  recurringIncome,
  summary,
}: RecurringIncomePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Recurring inflow</p>
        <CardTitle>Keep predictable income visible and easy to trust</CardTitle>
        <p className="text-sm leading-7 text-muted">
          {summary.recurringCount} recurring income
          {summary.recurringCount === 1 ? "" : "s"} currently account for{" "}
          {formatTransactionAmount(summary.recurringPipeline)} in expected cash-in.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurringIncome.length ? (
          recurringIncome.slice(0, 5).map((income) => (
            <div
              key={income.id}
              className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{income.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {income.categoryLabel}
                  </p>
                </div>
                <Badge variant={income.status === "pending" ? "warning" : "success"}>
                  {income.recurringInterval || "Recurring"}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <span>{formatTransactionSourceLabel(income.source)}</span>
                <span>{formatTransactionDate(income.transactionDate)}</span>
              </div>
              <p className="mt-3 text-base font-semibold text-success">
                {formatTransactionAmount(income.amount, income.currency)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No recurring income yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Mark salary, retainers, or repeating payout streams as recurring to track them here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
