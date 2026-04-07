"use client";

import { AlertTriangle, FileStack, LoaderCircle, Receipt } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentSummary } from "@/types/finance";

type DocumentSummaryStripProps = {
  summary: DocumentSummary;
};

const summaryCardMeta = [
  {
    key: "totalCount",
    label: "Total files",
    description: "Every uploaded receipt, bill, invoice, and supporting document in the workspace.",
    icon: FileStack,
    tone: "text-secondary",
  },
  {
    key: "receiptCount",
    label: "Receipts",
    description: "Image-first uploads that will feed the OCR and categorization pipeline.",
    icon: Receipt,
    tone: "text-primary",
  },
  {
    key: "processingCount",
    label: "Processing",
    description: "Files currently staged for extraction or awaiting the next automation step.",
    icon: LoaderCircle,
    tone: "text-warning",
  },
  {
    key: "failedCount",
    label: "Failed",
    description: "Documents that need a retry, replacement file, or manual follow-up.",
    icon: AlertTriangle,
    tone: "text-danger",
  },
] as const;

export function DocumentSummaryStrip({ summary }: DocumentSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCardMeta.map((item) => {
        const Icon = item.icon;
        const value = String(summary[item.key]);

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
