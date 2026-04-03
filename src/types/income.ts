import type { z } from "zod";

import { incomeQuickAddSchema } from "@/lib/validations/income";
import type {
  TransactionCategoryOption,
  TransactionRecord,
  TransactionWorkspaceState,
} from "@/types/finance";

export type IncomeQuickAddInput = z.infer<typeof incomeQuickAddSchema>;
export type IncomeQuickAddFormInput = z.input<typeof incomeQuickAddSchema>;

export type IncomeSummary = {
  totalIncome: number;
  averageIncome: number;
  recurringPipeline: number;
  recurringCount: number;
  pendingCount: number;
  invoiceLinkedTotal: number;
  topSourceLabel: string;
  topSourceAmount: number;
};

export type IncomeSourceBreakdownItem = {
  source: TransactionRecord["source"];
  label: string;
  amount: number;
  share: number;
  count: number;
  color: string;
};

export type IncomeTrendPoint = {
  label: string;
  income: number;
};

export type IncomeSavedViewId =
  | "all"
  | "recurring"
  | "pending"
  | "invoice-linked";

export type IncomeSavedView = {
  id: IncomeSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type IncomePageFilters = {
  category: string;
  source: string;
  dateFrom: string;
  dateTo: string;
};

export type IncomeWorkspaceState = {
  incomes: TransactionRecord[];
  categories: TransactionCategoryOption[];
  summary: IncomeSummary;
  breakdown: IncomeSourceBreakdownItem[];
  trend: IncomeTrendPoint[];
  recurringIncome: TransactionRecord[];
  source: TransactionWorkspaceState["source"];
};
