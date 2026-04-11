import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportHistoryRecord } from "@/types/finance";
import {
  formatReportCurrency,
  formatReportDateRange,
  getReportTypeLabel,
} from "@/features/reports/report-utils";

type PrintableReportCardProps = {
  current: ReportHistoryRecord;
};

export function PrintableReportCard({ current }: PrintableReportCardProps) {
  return (
    <Card className="rounded-[1.7rem] print:shadow-none">
      <CardHeader className="border-b border-border/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Printable report</p>
            <CardTitle className="mt-3">{getReportTypeLabel(current.response.reportType)}</CardTitle>
            <CardDescription className="mt-2">
              {formatReportDateRange(current.response.periodStart, current.response.periodEnd)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={current.source === "openai" ? "primary" : "neutral"}>
              {current.source === "openai" ? "OpenAI narrative" : "Fallback narrative"}
            </Badge>
            <Badge variant="secondary">{current.format.toUpperCase()} ready</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Income</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              {formatReportCurrency(current.response.totals.income)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Expenses</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              {formatReportCurrency(current.response.totals.expenses)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Savings</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              {formatReportCurrency(current.response.totals.savings)}
            </p>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border bg-surface-subtle p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Narrative</p>
          <p className="mt-4 text-sm leading-8 text-foreground">{current.response.narrative}</p>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Highlights</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-foreground">
              {current.response.highlights.length ? (
                current.response.highlights.map((item) => <li key={item}>• {item}</li>)
              ) : (
                <li className="text-muted">No highlights were generated.</li>
              )}
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-border p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Actions</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-foreground">
              {current.response.actions.length ? (
                current.response.actions.map((item) => <li key={item}>• {item}</li>)
              ) : (
                <li className="text-muted">No actions were generated.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-border p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Top categories</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-subtle text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {current.response.topCategories.length ? (
                    current.response.topCategories.map((category) => (
                      <tr key={category.label} className="border-t border-border">
                        <td className="px-4 py-3">{category.label}</td>
                        <td className="px-4 py-3">{formatReportCurrency(category.amount)}</td>
                        <td className="px-4 py-3">{category.sharePercent.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-muted" colSpan={3}>
                        No top expense categories were available for the selected range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Planning summary</p>
            <div className="mt-4 space-y-4 text-sm leading-7">
              <div className="rounded-2xl border border-border bg-surface-subtle p-4">
                <p className="font-semibold text-foreground">Budget health</p>
                <p className="mt-2 text-muted">
                  {current.response.budgetSummary.activeCount} active budgets, {current.response.budgetSummary.watchCount} on watch, {current.response.budgetSummary.overCount} over plan.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-subtle p-4">
                <p className="font-semibold text-foreground">Goals</p>
                <p className="mt-2 text-muted">
                  {current.response.goalSummary.activeCount} active goals, {current.response.goalSummary.completedCount} completed, {current.response.goalSummary.dueSoonCount} due soon.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-subtle p-4">
                <p className="font-semibold text-foreground">Data quality</p>
                <p className="mt-2 text-muted">
                  {current.response.transactionSummary.pendingCount} pending and {current.response.transactionSummary.uncategorizedCount} uncategorized transactions still affect accuracy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
