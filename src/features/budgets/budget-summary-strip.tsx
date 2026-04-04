"use client";

import { BadgeIndianRupee, ShieldAlert, Target, WalletCards } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { BudgetSummary } from "@/types/finance";

type BudgetSummaryStripProps = {
  summary: BudgetSummary;
};

const summaryCardMeta = [
  {
    key: "totalBudgeted",
    label: "Planned limit",
    description: "The combined ceiling across active budgets in the current workspace.",
    icon: WalletCards,
    tone: "text-secondary",
  },
  {
    key: "totalSpent",
    label: "Tracked spend",
    description: "Actual expense volume already mapped into those budget windows.",
    icon: BadgeIndianRupee,
    tone: "text-primary",
  },
  {
    key: "totalRemaining",
    label: "Room left",
    description: "The remaining headroom before the active budgets are fully used.",
    icon: Target,
    tone: "text-success",
  },
  {
    key: "attentionCount",
    label: "Needs attention",
    description: "Budgets that are either on watch or already over the planned limit.",
    icon: ShieldAlert,
    tone: "text-danger",
  },
] as const;

export function BudgetSummaryStrip({ summary }: BudgetSummaryStripProps) {
  const attentionCount = summary.watchCount + summary.overCount;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCardMeta.map((item) => {
        const Icon = item.icon;
        const value =
          item.key === "attentionCount"
            ? String(attentionCount)
            : item.key === "totalSpent"
              ? formatTransactionAmount(summary.totalSpent)
              : item.key === "totalRemaining"
                ? formatTransactionAmount(summary.totalRemaining)
                : formatTransactionAmount(summary.totalBudgeted);

        return (
          <Card key={item.key} className="rounded-[1.6rem]">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <p className="text-sm font-medium text-muted">{item.label}</p>
                <CardTitle className="mt-3 text-3xl">{value}</CardTitle>
              </div>
              <div className={`rounded-2xl bg-surface-subtle p-3 ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
