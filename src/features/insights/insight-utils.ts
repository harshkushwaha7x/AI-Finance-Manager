import type { InsightHistoryRecord, InsightSuggestionItem } from "@/types/finance";

export function formatInsightCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInsightGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getInsightPriorityVariant(priority: InsightSuggestionItem["priority"]) {
  if (priority === "high") {
    return "warning" as const;
  }

  if (priority === "medium") {
    return "secondary" as const;
  }

  return "neutral" as const;
}

export function buildInsightStatCards(current: InsightHistoryRecord) {
  return [
    {
      label: "Est. savings",
      value: formatInsightCurrency(current.totalEstimatedSavings),
      detail: "Total opportunity across the current AI suggestion set.",
      delta: current.source === "openai" ? "AI generated" : "Fallback generated",
      deltaTone: current.source === "openai" ? ("success" as const) : ("secondary" as const),
    },
    {
      label: "Anomalies",
      value: String(current.response.anomalies.length),
      detail: "Spending patterns or workflow signals that look unusual right now.",
      delta: current.response.anomalies.length ? "Review now" : "Stable",
      deltaTone: current.response.anomalies.length ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Risks",
      value: String(current.response.risks.length),
      detail: "Pressure points that could affect cashflow, reserves, or reporting clarity.",
      delta: current.response.risks.length ? "Active" : "Low",
      deltaTone: current.response.risks.length ? ("danger" as const) : ("success" as const),
    },
    {
      label: "Actions",
      value: String(current.response.actions.length),
      detail: "Concrete next steps already translated from the current finance context.",
      delta: current.periodLabel,
      deltaTone: "secondary" as const,
    },
  ];
}
