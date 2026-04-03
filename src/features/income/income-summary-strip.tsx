"use client";

import { ArrowDownLeft, Clock3, ReceiptText, Repeat } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { IncomeSummary } from "@/types/income";

type IncomeSummaryStripProps = {
  summary: IncomeSummary;
};

const summaryCardMeta = [
  {
    key: "totalIncome",
    label: "Cash in",
    description: "Total incoming money visible in the current workspace.",
    icon: ArrowDownLeft,
    tone: "text-success",
  },
  {
    key: "averageIncome",
    label: "Average credit",
    description: "The mean size of an income event across the list.",
    icon: ReceiptText,
    tone: "text-primary",
  },
  {
    key: "recurringPipeline",
    label: "Recurring pipeline",
    description: "Income already expected to repeat in the coming cycle.",
    icon: Repeat,
    tone: "text-warning",
  },
  {
    key: "pendingCount",
    label: "Pending cash-in",
    description: "Entries that still need to clear or be followed up.",
    icon: Clock3,
    tone: "text-secondary",
  },
] as const;

export function IncomeSummaryStrip({ summary }: IncomeSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCardMeta.map((item) => {
        const Icon = item.icon;
        const value =
          item.key === "pendingCount"
            ? String(summary.pendingCount)
            : item.key === "averageIncome"
              ? formatTransactionAmount(summary.averageIncome)
              : item.key === "recurringPipeline"
                ? formatTransactionAmount(summary.recurringPipeline)
                : formatTransactionAmount(summary.totalIncome);

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
