import "server-only";

import {
  buildExpenseBreakdown,
  buildExpenseSummary,
  getExpenseCategories,
  getExpenseTransactions,
  getRecurringExpenses,
} from "@/features/expenses/expense-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import type { ExpenseWorkspaceState } from "@/types/expenses";

export async function getExpensesWorkspaceState(
  viewer: ViewerContext,
): Promise<ExpenseWorkspaceState> {
  const transactionState = await getTransactionWorkspaceState(viewer);
  const categories = getExpenseCategories(transactionState.categories);
  const expenses = getExpenseTransactions(transactionState.transactions);
  const breakdown = buildExpenseBreakdown(expenses, categories);

  return {
    expenses,
    categories,
    summary: buildExpenseSummary(expenses, breakdown),
    breakdown,
    recurringExpenses: getRecurringExpenses(expenses),
    source: transactionState.source,
  };
}
