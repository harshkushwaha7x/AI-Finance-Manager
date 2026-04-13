import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTaxCurrency, formatTaxDate } from "@/features/tax-center/tax-utils";
import type { TaxWorkspaceState } from "@/types/finance";

type TaxActivityPanelProps = {
  state: TaxWorkspaceState;
};

function getDocumentVariant(status: TaxWorkspaceState["documentHighlights"][number]["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "failed") {
    return "danger" as const;
  }

  if (status === "review") {
    return "warning" as const;
  }

  return "secondary" as const;
}

function getInvoiceVariant(status: TaxWorkspaceState["invoiceHighlights"][number]["status"]) {
  if (status === "paid") {
    return "success" as const;
  }

  if (status === "overdue") {
    return "danger" as const;
  }

  if (status === "draft") {
    return "secondary" as const;
  }

  return "warning" as const;
}

export function TaxActivityPanel({ state }: TaxActivityPanelProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="rounded-[1.7rem]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Invoice watch</p>
          <CardTitle className="mt-3">Recent GST-linked invoices</CardTitle>
          <CardDescription className="mt-2">
            These invoices are the fastest way to validate sales, tax, and collection quality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.invoiceHighlights.length ? (
            state.invoiceHighlights.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-[1.4rem] border border-border bg-surface-subtle p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">{invoice.customerName}</p>
                  </div>
                  <Badge variant={getInvoiceVariant(invoice.status)}>{invoice.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm leading-7 text-muted">
                  <p>Issue date: {formatTaxDate(invoice.issueDate)}</p>
                  <p>Total: {formatTaxCurrency(invoice.totalAmount)}</p>
                  <p>GST: {formatTaxCurrency(invoice.taxAmount)}</p>
                  <p>Customer GSTIN: {invoice.customerGstin || "Not provided"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
              No invoices landed in the active tax period.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.7rem]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Document watch</p>
          <CardTitle className="mt-3">Supporting tax documents</CardTitle>
          <CardDescription className="mt-2">
            Keep challans, tax notes, receipts, and bills visible so filing prep does not start cold.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state.documentHighlights.length ? (
            state.documentHighlights.map((document) => (
              <div
                key={document.id}
                className="rounded-[1.4rem] border border-border bg-surface-subtle p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{document.originalName}</p>
                    <p className="mt-1 text-sm leading-7 text-muted">
                      Uploaded {new Date(document.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <Badge variant={getDocumentVariant(document.status)}>{document.status}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {document.aiSummary || "No extraction summary is stored for this file yet."}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
              No tax-focused documents are visible inside the active period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
