import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTaxCurrency } from "@/features/tax-center/tax-utils";
import type { TaxWorkspaceState } from "@/types/finance";

type TaxGstBreakdownCardProps = {
  state: TaxWorkspaceState;
};

export function TaxGstBreakdownCard({ state }: TaxGstBreakdownCardProps) {
  const invoiceCoverage =
    state.breakdown.invoiceCount > 0
      ? Math.round((state.breakdown.invoicesWithGstin / state.breakdown.invoiceCount) * 100)
      : 0;

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">GST breakdown</p>
            <CardTitle className="mt-3">Sales, collections, and coverage</CardTitle>
            <CardDescription className="mt-2">
              Use this block to understand invoice-backed GST exposure before filing or accountant review.
            </CardDescription>
          </div>
          <Badge variant={invoiceCoverage >= 80 ? "success" : invoiceCoverage >= 40 ? "warning" : "danger"}>
            {invoiceCoverage}% GST coverage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Taxable sales</p>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatTaxCurrency(state.summary.taxableSales)}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Across {state.breakdown.invoiceCount} invoices in the active period.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Paid collections</p>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatTaxCurrency(state.summary.paidCollections)}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            {state.breakdown.paidInvoiceCount} paid invoices and {state.breakdown.overdueInvoiceCount} overdue.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-border p-5">
          <p className="text-sm font-semibold text-foreground">Invoice mix</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>{state.breakdown.draftInvoiceCount} draft invoices still need review.</p>
            <p>{state.breakdown.invoicesWithGstin} invoices carry customer GST details.</p>
            <p>{state.breakdown.pendingTransactionCount} pending transactions may affect tax accuracy.</p>
          </div>
        </div>
        <div className="rounded-[1.4rem] border border-border p-5">
          <p className="text-sm font-semibold text-foreground">Document support</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>{state.breakdown.taxDocumentCount} tax-specific document(s) detected.</p>
            <p>{state.breakdown.receiptReviewCount} receipt or bill item(s) still need review.</p>
            <p>{state.breakdown.uncategorizedCount} uncategorized transaction(s) are still visible.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
