import { FileText, Receipt, ShieldAlert, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInvoiceCurrency } from "@/features/invoices/invoice-utils";
import type { InvoiceSummary } from "@/types/finance";

type InvoiceSummaryStripProps = {
  summary: InvoiceSummary;
};

const summaryCards = [
  {
    key: "totalInvoiceValue",
    label: "Total billed",
    icon: FileText,
    tone: "text-primary",
    description: "Full invoice value tracked in the workspace.",
  },
  {
    key: "paidValue",
    label: "Collected",
    icon: Wallet,
    tone: "text-success",
    description: "Paid invoices already reflected as revenue.",
  },
  {
    key: "outstandingValue",
    label: "Outstanding",
    icon: Receipt,
    tone: "text-warning",
    description: "Invoices still waiting for payment.",
  },
  {
    key: "overdueCount",
    label: "Overdue",
    icon: ShieldAlert,
    tone: "text-danger",
    description: "Invoices that need follow-up right now.",
  },
] as const;

export function InvoiceSummaryStrip({ summary }: InvoiceSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const value =
          card.key === "overdueCount"
            ? String(summary.overdueCount)
            : card.key === "outstandingValue"
              ? formatInvoiceCurrency(summary.outstandingValue)
              : card.key === "paidValue"
                ? formatInvoiceCurrency(summary.paidValue)
                : formatInvoiceCurrency(summary.totalInvoiceValue);

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
