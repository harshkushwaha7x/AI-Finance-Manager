"use client";

import { BadgeIndianRupee, Gauge, Repeat, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { ExpenseSummary } from "@/types/expenses";

type ExpenseSummaryStripProps = {
  summary: ExpenseSummary;
};

const summaryCardMeta = [
  {
    key: "totalSpend",
    label: "Month spend",
    description: "Total tracked outgoing amount in the current workspace.",
    icon: BadgeIndianRupee,
    tone: "text-secondary",
  },
  {
    key: "averageExpense",
    label: "Average entry",
    description: "The mean size of an expense event across the list.",
    icon: Gauge,
    tone: "text-primary",
  },
  {
    key: "recurringCommitments",
    label: "Recurring load",
    description: "Monthly commitments already visible in the ledger.",
    icon: Repeat,
    tone: "text-warning",
  },
  {
    key: "reviewCount",
    label: "Needs review",
    description: "Pending spend items that still need attention.",
    icon: ShieldAlert,
    tone: "text-danger",
  },
] as const;

export function ExpenseSummaryStrip({ summary }: ExpenseSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCardMeta.map((item) => {
        const Icon = item.icon;
        const value =
          item.key === "reviewCount"
            ? String(summary.reviewCount)
            : item.key === "averageExpense"
              ? formatTransactionAmount(summary.averageExpense)
              : item.key === "recurringCommitments"
                ? formatTransactionAmount(summary.recurringCommitments)
                : formatTransactionAmount(summary.totalSpend);

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
