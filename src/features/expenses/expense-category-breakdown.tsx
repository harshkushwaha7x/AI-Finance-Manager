"use client";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { ExpenseCategoryBreakdownItem } from "@/types/expenses";

type ExpenseCategoryBreakdownProps = {
  breakdown: ExpenseCategoryBreakdownItem[];
};

export function ExpenseCategoryBreakdown({
  breakdown,
}: ExpenseCategoryBreakdownProps) {
  return (
    <ChartShell
      title="Category breakdown"
      description="See which spending lanes are driving monthly pressure before budgeting and AI insights are layered on."
      badge="Expense mix"
      className="h-full"
    >
      <div className="space-y-4">
        {breakdown.length ? (
          breakdown.map((item) => (
            <div key={item.categoryId ?? item.label} className="space-y-3 rounded-2xl border border-black/6 bg-surface-subtle p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted">
                      {item.count} record{item.count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatTransactionAmount(item.amount)}
                  </p>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">{item.share}% share</p>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-background">
                <div
                  className="h-2.5 rounded-full transition-[width]"
                  style={{
                    width: `${Math.min(item.share, 100)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No expense categories yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Add a few expense entries and this widget will immediately show how spending is distributed.
            </p>
          </div>
        )}
      </div>
    </ChartShell>
  );
}
