"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "@/features/transactions/transaction-utils";
import type { ExpenseSummary } from "@/types/expenses";
import type { TransactionRecord } from "@/types/finance";

type RecurringExpensePanelProps = {
  recurringExpenses: TransactionRecord[];
  summary: ExpenseSummary;
};

export function RecurringExpensePanel({
  recurringExpenses,
  summary,
}: RecurringExpensePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Recurring load</p>
        <CardTitle>Track the bills that quietly shape every month</CardTitle>
        <p className="text-sm leading-7 text-muted">
          {summary.recurringCount} recurring expense
          {summary.recurringCount === 1 ? "" : "s"} currently account for{" "}
          {formatTransactionAmount(summary.recurringCommitments)} in visible commitments.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurringExpenses.length ? (
          recurringExpenses.slice(0, 5).map((expense) => (
            <div
              key={expense.id}
              className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{expense.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {expense.categoryLabel}
                  </p>
                </div>
                <Badge variant={expense.status === "pending" ? "warning" : "success"}>
                  {expense.recurringInterval || "Recurring"}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <span>{expense.paymentMethod || "Payment method not added"}</span>
                <span>{formatTransactionDate(expense.transactionDate)}</span>
              </div>
              <p className="mt-3 text-base font-semibold text-foreground">
                {formatTransactionAmount(expense.amount, expense.currency)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No recurring expenses yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Mark subscriptions, retainers, rent, or tax reserves as recurring to see them grouped here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
