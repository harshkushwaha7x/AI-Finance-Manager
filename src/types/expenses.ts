import type { z } from "zod";

import type {
  TransactionCategoryOption,
  TransactionRecord,
  TransactionWorkspaceState,
} from "@/types/finance";
import { expenseQuickAddSchema } from "@/lib/validations/expenses";

export type ExpenseQuickAddInput = z.infer<typeof expenseQuickAddSchema>;
export type ExpenseQuickAddFormInput = z.input<typeof expenseQuickAddSchema>;

export type ExpenseSummary = {
  totalSpend: number;
  averageExpense: number;
  recurringCommitments: number;
  recurringCount: number;
  reviewCount: number;
  topCategoryLabel: string;
  topCategoryAmount: number;
};

export type ExpenseCategoryBreakdownItem = {
  categoryId?: string;
  label: string;
  amount: number;
  share: number;
  color: string;
  count: number;
};

export type ExpenseSavedViewId =
  | "all"
  | "recurring"
  | "needs-review"
  | "software-tax";

export type ExpenseSavedView = {
  id: ExpenseSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type ExpensePageFilters = {
  category: string;
  dateFrom: string;
  dateTo: string;
};

export type ExpenseWorkspaceState = {
  expenses: TransactionRecord[];
  categories: TransactionCategoryOption[];
  summary: ExpenseSummary;
  breakdown: ExpenseCategoryBreakdownItem[];
  recurringExpenses: TransactionRecord[];
  source: TransactionWorkspaceState["source"];
};
