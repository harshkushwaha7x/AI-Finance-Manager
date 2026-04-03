"use client";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { IncomeSourceBreakdownItem } from "@/types/income";

type IncomeSourceBreakdownProps = {
  breakdown: IncomeSourceBreakdownItem[];
};

export function IncomeSourceBreakdown({
  breakdown,
}: IncomeSourceBreakdownProps) {
  return (
    <ChartShell
      title="Income source mix"
      description="See how much of your current cash-in depends on manual tracking, invoices, or recurring inflow channels."
      badge="By source"
      className="h-full"
    >
      <div className="space-y-4">
        {breakdown.length ? (
          breakdown.map((item) => (
            <div key={item.source} className="space-y-3 rounded-2xl border border-black/6 bg-surface-subtle p-4">
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
            <p className="font-display text-2xl font-bold text-foreground">No income sources yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Add a few income entries and this widget will immediately show how your cash-in mix is structured.
            </p>
          </div>
        )}
      </div>
    </ChartShell>
  );
}
