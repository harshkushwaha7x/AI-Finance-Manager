import { StatCard } from "@/components/shared/stat-card";
import type { ReportHistoryRecord } from "@/types/finance";
import { formatReportCurrency } from "@/features/reports/report-utils";

type ReportSummaryStripProps = {
  current: ReportHistoryRecord;
};

export function ReportSummaryStrip({ current }: ReportSummaryStripProps) {
  const savingsTone =
    current.response.totals.savings >= 0
      ? ("success" as const)
      : ("danger" as const);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Income"
        value={formatReportCurrency(current.response.totals.income)}
        detail={`Across ${current.response.transactionSummary.incomeCount} cash-in entries in the selected period.`}
      />
      <StatCard
        label="Expenses"
        value={formatReportCurrency(current.response.totals.expenses)}
        detail={`Across ${current.response.transactionSummary.expenseCount} outgoing transactions.`}
      />
      <StatCard
        label="Savings"
        value={formatReportCurrency(current.response.totals.savings)}
        detail="Net result after subtracting expenses from tracked income."
        delta={current.response.totals.savings >= 0 ? "Positive" : "Negative"}
        deltaTone={savingsTone}
      />
      <StatCard
        label="Report quality"
        value={`${current.response.transactionSummary.pendingCount + current.response.transactionSummary.uncategorizedCount}`}
        detail="Pending plus uncategorized items still affecting export accuracy."
        delta={`${current.response.transactionSummary.recurringCount} recurring`}
        deltaTone="secondary"
      />
    </section>
  );
}
