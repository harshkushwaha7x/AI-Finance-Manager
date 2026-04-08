"use client";

import { ArrowDownLeft, ArrowUpRight, Repeat, ShieldAlert, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { TransactionSummary } from "@/types/finance";

type TransactionSummaryStripProps = {
  summary: TransactionSummary;
};

const summaryCards = [
  {
    key: "incomeTotal",
    label: "Cash in",
    icon: ArrowDownLeft,
    tone: "text-success",
    description: "Income settled this cycle.",
  },
  {
    key: "expenseTotal",
    label: "Cash out",
    icon: ArrowUpRight,
    tone: "text-secondary",
    description: "Tracked operating spend.",
  },
  {
    key: "reviewCount",
    label: "Needs review",
    icon: ShieldAlert,
    tone: "text-warning",
    description: "Transactions still pending.",
  },
  {
    key: "recurringCount",
    label: "Recurring",
    icon: Repeat,
    tone: "text-primary",
    description: "Rules-friendly records.",
  },
  {
    key: "categorizationQueueCount",
    label: "AI queue",
    icon: Sparkles,
    tone: "text-primary",
    description: "Uncategorized entries to review.",
  },
] as const;

export function TransactionSummaryStrip({ summary }: TransactionSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === "incomeTotal"
            ? formatTransactionAmount(summary.incomeTotal)
            : card.key === "expenseTotal"
              ? formatTransactionAmount(summary.expenseTotal)
              : card.key === "reviewCount"
                ? String(summary.reviewCount)
                : card.key === "recurringCount"
                  ? String(summary.recurringCount)
                  : String(summary.categorizationQueueCount);

        return (
          <Card key={card.key} className="rounded-[1.6rem]">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <p className="text-sm font-medium text-muted">{card.label}</p>
                <CardTitle className="mt-3 text-3xl">{value}</CardTitle>
              </div>
              <div className={`rounded-2xl bg-surface-subtle p-3 ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
