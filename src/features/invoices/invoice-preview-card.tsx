import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceStatus,
  getInvoiceStatusVariant,
} from "@/features/invoices/invoice-utils";
import type { InvoiceRecord } from "@/types/finance";

type InvoicePreviewCardProps = {
  invoice: InvoiceRecord | null;
};

export function InvoicePreviewCard({ invoice }: InvoicePreviewCardProps) {
  if (!invoice) {
    return (
      <Card className="rounded-[1.7rem]">
        <CardHeader>
          <CardTitle>Invoice preview</CardTitle>
          <CardDescription>
            Select an invoice to review its items, tax totals, and collection state.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted">
          The preview panel becomes the printable surface for the invoice module and will also support stakeholder sharing.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader className="border-b border-border/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Invoice preview</p>
            <CardTitle className="mt-3">{invoice.invoiceNumber}</CardTitle>
            <CardDescription className="mt-2">
              {invoice.customerName} • issued {formatInvoiceDate(invoice.issueDate)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getInvoiceStatusVariant(invoice.status)}>
              {formatInvoiceStatus(invoice.status)}
            </Badge>
            {invoice.linkedIncomeTransactionId ? (
              <Badge variant="success">Income synced</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Subtotal</p>
            <p className="mt-3 font-display text-2xl font-bold text-foreground">
              {formatInvoiceCurrency(invoice.subtotal, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">GST</p>
            <p className="mt-3 font-display text-2xl font-bold text-foreground">
              {formatInvoiceCurrency(invoice.taxAmount, invoice.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Total</p>
            <p className="mt-3 font-display text-2xl font-bold text-foreground">
              {formatInvoiceCurrency(invoice.totalAmount, invoice.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Client and settlement</p>
              <p className="mt-1 text-sm leading-7 text-muted">
                {invoice.customerEmail || "No client email provided"}
                {invoice.dueDate ? ` • due ${formatInvoiceDate(invoice.dueDate)}` : ""}
              </p>
            </div>
            <p className="text-sm leading-7 text-muted">
              {invoice.customerGstin || "GSTIN not provided"}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Line item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Line total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatInvoiceCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="px-4 py-3">{item.gstRate}%</td>
                  <td className="px-4 py-3">{formatInvoiceCurrency(item.lineTotal, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoice.notes ? (
          <div className="rounded-[1.5rem] border border-border bg-surface-subtle p-5 text-sm leading-7 text-muted">
            {invoice.notes}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
