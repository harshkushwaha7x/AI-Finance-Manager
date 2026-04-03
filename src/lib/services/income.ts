import "server-only";

import {
  buildIncomeSourceBreakdown,
  buildIncomeSummary,
  buildIncomeTrend,
  getIncomeCategories,
  getIncomeTransactions,
  getRecurringIncome,
} from "@/features/income/income-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import type { IncomeWorkspaceState } from "@/types/income";

export async function getIncomeWorkspaceState(
  viewer: ViewerContext,
): Promise<IncomeWorkspaceState> {
  const transactionState = await getTransactionWorkspaceState(viewer);
  const categories = getIncomeCategories(transactionState.categories);
  const incomes = getIncomeTransactions(transactionState.transactions);
  const breakdown = buildIncomeSourceBreakdown(incomes);

  return {
    incomes,
    categories,
    summary: buildIncomeSummary(incomes, breakdown),
    breakdown,
    trend: buildIncomeTrend(incomes),
    recurringIncome: getRecurringIncome(incomes),
    source: transactionState.source,
  };
}
