import type { ReportRequest } from "@/types/finance";

export type ReportPresetPeriod = "last_30_days" | "this_month" | "quarter_to_date" | "year_to_date";

export type ReportPresetId =
  | "monthly_snapshot"
  | "cashflow_scan"
  | "budget_health"
  | "tax_prep";

export type ReportPreset = {
  id: ReportPresetId;
  label: string;
  description: string;
  reportType: ReportRequest["reportType"];
  format: ReportRequest["format"];
  period: ReportPresetPeriod;
  tone: "primary" | "secondary" | "warning" | "success";
};
