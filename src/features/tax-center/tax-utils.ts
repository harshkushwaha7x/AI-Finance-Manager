import type { TaxChecklistItem, TaxPeriod, TaxWorkspaceState } from "@/types/finance";

export const taxPeriodOptions: Array<{
  value: TaxPeriod;
  label: string;
  description: string;
}> = [
  {
    value: "this_month",
    label: "This month",
    description: "Good for current GST and cash planning.",
  },
  {
    value: "quarter_to_date",
    label: "Quarter to date",
    description: "Useful for return prep and tax reserves.",
  },
  {
    value: "year_to_date",
    label: "Year to date",
    description: "Best for broader tax and accountant handoff reviews.",
  },
];

export function formatTaxCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTaxDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatTaxDateRange(periodStart: string, periodEnd: string) {
  return `${formatTaxDate(periodStart)} - ${formatTaxDate(periodEnd)}`;
}

export function getChecklistVariant(status: TaxChecklistItem["status"]) {
  if (status === "complete") {
    return "success" as const;
  }

  if (status === "warning") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function getReadinessTone(score: number) {
  if (score >= 80) {
    return "success" as const;
  }

  if (score >= 55) {
    return "warning" as const;
  }

  return "danger" as const;
}

export function buildTaxSummaryText(state: TaxWorkspaceState) {
  return [
    `Tax period: ${formatTaxDateRange(state.periodStart, state.periodEnd)}`,
    `Output GST: ${formatTaxCurrency(state.summary.outputTax)}`,
    `Estimated input tax: ${formatTaxCurrency(state.summary.estimatedInputTax)}`,
    `Net tax position: ${formatTaxCurrency(state.summary.netTaxPosition)}`,
    `Taxable sales: ${formatTaxCurrency(state.summary.taxableSales)}`,
    `Paid collections: ${formatTaxCurrency(state.summary.paidCollections)}`,
    `Reserve tracked: ${formatTaxCurrency(state.summary.taxReserveAmount)}`,
    `Readiness score: ${state.summary.readinessScore}/100`,
  ].join("\n");
}

export function downloadTaxWorkspaceJson(state: TaxWorkspaceState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `tax-center-${state.periodStart}-${state.periodEnd}.json`;
  link.click();

  URL.revokeObjectURL(url);
}
