"use client";

import { BadgeCheck, Eye, ReceiptText, ScanSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceiptWorkspaceSummary } from "@/types/receipts";

type ReceiptSummaryStripProps = {
  summary: ReceiptWorkspaceSummary;
};

const summaryMeta = [
  {
    key: "totalCount",
    label: "Total receipts",
    description: "Every receipt currently staged in the review queue.",
    icon: ReceiptText,
    tone: "text-primary",
  },
  {
    key: "needsExtractionCount",
    label: "Needs extraction",
    description: "Receipts that still need OCR or fallback parsing.",
    icon: ScanSearch,
    tone: "text-warning",
  },
  {
    key: "reviewCount",
    label: "Ready for review",
    description: "Receipts with extracted values waiting for a human pass.",
    icon: Eye,
    tone: "text-secondary",
  },
  {
    key: "reviewedCount",
    label: "Reviewed",
    description: "Receipts with finalized review state and saved fields.",
    icon: BadgeCheck,
    tone: "text-success",
  },
] as const;

export function ReceiptSummaryStrip({ summary }: ReceiptSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryMeta.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.key} className="rounded-[1.6rem]">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <p className="text-sm font-medium text-muted">{item.label}</p>
                <CardTitle className="mt-3 text-3xl">{summary[item.key]}</CardTitle>
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
