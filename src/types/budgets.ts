import type { TransactionCategoryOption } from "@/types/finance";
import type { BudgetAlert, BudgetRecord, BudgetSummary, BudgetWorkspaceState } from "@/types/finance";

export type BudgetSavedViewId =
  | "all"
  | "healthy"
  | "watch"
  | "over"
  | "quarterly";

export type BudgetSavedView = {
  id: BudgetSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type BudgetPageFilters = {
  category: string;
  period: string;
  status: string;
};

export type BudgetFocusItem = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
  amountLabel: string;
};

export type BudgetWorkspaceViewState = {
  budgets: BudgetRecord[];
  categories: TransactionCategoryOption[];
  summary: BudgetSummary;
  alerts: BudgetAlert[];
  source: BudgetWorkspaceState["source"];
};
