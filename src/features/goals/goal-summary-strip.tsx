"use client";

import { CheckCircle2, Flag, Target, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { GoalSummary } from "@/types/finance";

type GoalSummaryStripProps = {
  summary: GoalSummary;
};

const summaryCardMeta = [
  {
    key: "totalTarget",
    label: "Goal target",
    description: "The combined amount your active and completed goals are aiming to reach.",
    icon: Target,
    tone: "text-secondary",
  },
  {
    key: "totalCurrent",
    label: "Saved so far",
    description: "How much progress is already locked into the current goal portfolio.",
    icon: Wallet,
    tone: "text-primary",
  },
  {
    key: "highPriorityCount",
    label: "High priority",
    description: "Goals that deserve protection before lower-priority discretionary targets.",
    icon: Flag,
    tone: "text-warning",
  },
  {
    key: "completedCount",
    label: "Completed",
    description: "Targets already achieved and ready to reinforce the product story.",
    icon: CheckCircle2,
    tone: "text-success",
  },
] as const;

export function GoalSummaryStrip({ summary }: GoalSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCardMeta.map((item) => {
        const Icon = item.icon;
        const value =
          item.key === "totalTarget"
            ? formatTransactionAmount(summary.totalTarget)
            : item.key === "totalCurrent"
              ? formatTransactionAmount(summary.totalCurrent)
              : item.key === "highPriorityCount"
                ? String(summary.highPriorityCount)
                : String(summary.completedCount);

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
