import type {
  MonthlyReportResponse,
  ReportHistoryRecord,
  ReportRequest,
} from "@/types/finance";
import type { ReportPreset, ReportPresetId, ReportPresetPeriod } from "@/types/reports";

function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatReportCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatReportDateRange(periodStart: string, periodEnd: string) {
  return `${formatReportDate(periodStart)} - ${formatReportDate(periodEnd)}`;
}

export function getReportTypeLabel(reportType: ReportRequest["reportType"]) {
  switch (reportType) {
    case "cashflow":
      return "Cashflow";
    case "budget":
      return "Budget";
    case "tax":
      return "Tax";
    case "custom":
      return "Custom";
    default:
      return "Monthly summary";
  }
}

export function resolvePeriodDates(period: ReportPresetPeriod) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === "this_month") {
    return {
      periodStart: formatDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
      periodEnd: formatDateString(today),
    };
  }

  if (period === "quarter_to_date") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;

    return {
      periodStart: formatDateString(new Date(today.getFullYear(), quarterStartMonth, 1)),
      periodEnd: formatDateString(today),
    };
  }

  if (period === "year_to_date") {
    return {
      periodStart: formatDateString(new Date(today.getFullYear(), 0, 1)),
      periodEnd: formatDateString(today),
    };
  }

  const start = new Date(today);
  start.setDate(start.getDate() - 29);

  return {
    periodStart: formatDateString(start),
    periodEnd: formatDateString(today),
  };
}

export function buildReportPresets(): ReportPreset[] {
  return [
    {
      id: "monthly_snapshot",
      label: "Monthly snapshot",
      description: "Generate the default startup-style monthly summary with narrative, highlights, and action items.",
      reportType: "monthly_summary",
      format: "pdf",
      period: "last_30_days",
      tone: "primary",
    },
    {
      id: "cashflow_scan",
      label: "Cashflow scan",
      description: "Focus on incoming vs outgoing movement and expose where net cashflow is tightening.",
      reportType: "cashflow",
      format: "csv",
      period: "this_month",
      tone: "secondary",
    },
    {
      id: "budget_health",
      label: "Budget health",
      description: "Summarize plan-vs-actual pressure so overspend and watch budgets become obvious quickly.",
      reportType: "budget",
      format: "json",
      period: "quarter_to_date",
      tone: "warning",
    },
    {
      id: "tax_prep",
      label: "Tax prep view",
      description: "Assemble a tax-oriented summary for accountant handoff and compliance-ready follow-up.",
      reportType: "tax",
      format: "pdf",
      period: "year_to_date",
      tone: "success",
    },
  ];
}

export function buildReportRequestFromPreset(presetId: ReportPresetId): ReportRequest {
  const preset = buildReportPresets().find((item) => item.id === presetId) ?? buildReportPresets()[0];
  const { periodStart, periodEnd } = resolvePeriodDates(preset.period);

  return {
    reportType: preset.reportType,
    format: preset.format,
    periodStart,
    periodEnd,
  };
}

export function buildReportCsvContent(report: MonthlyReportResponse) {
  const rows = [
    ["Section", "Label", "Value"],
    ["Summary", "Report type", getReportTypeLabel(report.reportType)],
    ["Summary", "Period start", report.periodStart],
    ["Summary", "Period end", report.periodEnd],
    ["Totals", "Income", String(report.totals.income)],
    ["Totals", "Expenses", String(report.totals.expenses)],
    ["Totals", "Savings", String(report.totals.savings)],
    ["Transactions", "Transaction count", String(report.transactionSummary.transactionCount)],
    ["Transactions", "Pending count", String(report.transactionSummary.pendingCount)],
    ["Transactions", "Uncategorized count", String(report.transactionSummary.uncategorizedCount)],
    ["Budgets", "Total budgeted", String(report.budgetSummary.totalBudgeted)],
    ["Budgets", "Total spent", String(report.budgetSummary.totalSpent)],
    ["Budgets", "Watch budgets", String(report.budgetSummary.watchCount)],
    ["Budgets", "Over budgets", String(report.budgetSummary.overCount)],
    ["Goals", "Active goals", String(report.goalSummary.activeCount)],
    ["Goals", "Completed goals", String(report.goalSummary.completedCount)],
    ["Goals", "Due soon goals", String(report.goalSummary.dueSoonCount)],
    ["Narrative", "Summary", report.narrative],
  ];

  for (const highlight of report.highlights) {
    rows.push(["Highlights", "Highlight", highlight]);
  }

  for (const action of report.actions) {
    rows.push(["Actions", "Action", action]);
  }

  for (const category of report.topCategories) {
    rows.push([
      "Top categories",
      category.label,
      `${category.amount} (${category.sharePercent.toFixed(1)}%)`,
    ]);
  }

  for (const point of report.cashflowTrend) {
    rows.push([
      "Cashflow trend",
      point.date,
      `income=${point.income}; expenses=${point.expenses}; net=${point.netCashflow}`,
    ]);
  }

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

export function buildReportShareText(record: ReportHistoryRecord) {
  return [
    `${getReportTypeLabel(record.response.reportType)} report`,
    `Period: ${formatReportDateRange(record.response.periodStart, record.response.periodEnd)}`,
    `Income: ${formatReportCurrency(record.response.totals.income)}`,
    `Expenses: ${formatReportCurrency(record.response.totals.expenses)}`,
    `Savings: ${formatReportCurrency(record.response.totals.savings)}`,
    `Narrative: ${record.response.narrative}`,
  ].join("\n");
}

export function downloadBlobFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}
