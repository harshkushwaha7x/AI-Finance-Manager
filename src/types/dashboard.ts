import type { TransactionRecord } from "@/types/finance";

export type DashboardMetricCard = {
  label: string;
  value: string;
  detail: string;
  delta?: string;
  deltaTone?: "success" | "warning" | "danger" | "secondary";
};

export type DashboardCashflowPoint = {
  label: string;
  inflow: number;
  outflow: number;
};

export type DashboardSpendDistributionPoint = {
  name: string;
  value: number;
};

export type DashboardBudgetComparisonPoint = {
  category: string;
  planned: number;
  actual: number;
  status: "healthy" | "watch" | "over";
};

export type DashboardGoalPreview = {
  title: string;
  description: string;
  current: number;
  target: number;
  unitLabel: string;
  tone: "success" | "warning" | "secondary";
};

export type DashboardActivityItem = {
  id: string;
  title: string;
  detail: string;
  badge: string;
  badgeTone: "success" | "warning" | "secondary";
  amountLabel: string;
  dateLabel: string;
};

export type DashboardOverviewState = {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  summaryTitle: string;
  summaryDescription: string;
  metricCards: DashboardMetricCard[];
  cashflowTrend: DashboardCashflowPoint[];
  spendDistribution: DashboardSpendDistributionPoint[];
  budgetComparison: DashboardBudgetComparisonPoint[];
  goalPreviews: DashboardGoalPreview[];
  recentActivity: DashboardActivityItem[];
  quickActions: Array<{
    label: string;
    href: string;
  }>;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  pendingCount: number;
  focusAreas: string[];
  latestTransactions: TransactionRecord[];
};
