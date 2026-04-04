import "server-only";

import {
  buildDashboardBudgetComparisonFromBudgets,
  buildDashboardBudgetComparison,
  buildDashboardCashflowTrend,
  buildDashboardGoalPreviews,
  buildDashboardMetricCards,
  buildDashboardRecentActivity,
  buildDashboardSpendDistribution,
} from "@/features/dashboard/dashboard-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getBudgetWorkspaceState } from "@/lib/services/budgets";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import type { DashboardOverviewState } from "@/types/dashboard";

function getSummaryCopy(profileType: DashboardOverviewState["profileType"]) {
  if (profileType === "personal") {
    return {
      title: "A personal finance cockpit that stays grounded in real activity",
      description:
        "Track income, spending, budget pressure, and savings momentum in one place before the deeper budgeting and goals modules arrive.",
    };
  }

  if (profileType === "business") {
    return {
      title: "A live finance overview for business operators",
      description:
        "See cash movement, top spend categories, runway-minded goal previews, and the most recent operational finance activity without hopping between modules.",
    };
  }

  return {
    title: "A real operating overview for freelance finance",
    description:
      "Use the dashboard as the control center for cash-in, outgoing spend, planning pressure, and the transaction activity that’s shaping the month.",
  };
}

function getQuickActions(profileType: DashboardOverviewState["profileType"]) {
  if (profileType === "personal") {
    return [
      { label: "Add expense", href: "/dashboard/expenses" },
      { label: "Track income", href: "/dashboard/income" },
      { label: "Review transactions", href: "/dashboard/transactions" },
      { label: "Open AI assistant", href: "/dashboard/ai-assistant" },
    ];
  }

  if (profileType === "business") {
    return [
      { label: "Review cashflow", href: "/dashboard/income" },
      { label: "Track operating spend", href: "/dashboard/expenses" },
      { label: "Open invoices", href: "/dashboard/invoices" },
      { label: "Book accountant help", href: "/dashboard/accountant" },
    ];
  }

  return [
    { label: "Add new transaction", href: "/dashboard/transactions" },
    { label: "Track expenses", href: "/dashboard/expenses" },
    { label: "Track income", href: "/dashboard/income" },
    { label: "Upload finance docs", href: "/dashboard/documents" },
  ];
}

export async function getDashboardOverviewState(
  viewer: ViewerContext,
): Promise<DashboardOverviewState> {
  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const budgetState = await getBudgetWorkspaceState(viewer);
  const transactions = transactionState.transactions;
  const incomes = transactions.filter((transaction) => transaction.type === "income");
  const expenses = transactions.filter((transaction) => transaction.type === "expense");
  const incomeTotal = incomes.reduce((total, transaction) => total + transaction.amount, 0);
  const expenseTotal = expenses.reduce((total, transaction) => total + transaction.amount, 0);
  const taxExpenseAmount = expenses
    .filter((transaction) => transaction.categoryLabel === "Tax")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const summaryCopy = getSummaryCopy(onboardingState.profileType);

  return {
    workspaceName: onboardingState.workspaceName || viewer.name || "Finance workspace",
    profileType: onboardingState.profileType,
    summaryTitle: summaryCopy.title,
    summaryDescription: summaryCopy.description,
    metricCards: buildDashboardMetricCards(transactions, onboardingState, budgetState.summary),
    cashflowTrend: buildDashboardCashflowTrend(transactions),
    spendDistribution: buildDashboardSpendDistribution(expenses),
    budgetComparison: budgetState.budgets.length
      ? buildDashboardBudgetComparisonFromBudgets(budgetState.budgets)
      : buildDashboardBudgetComparison(
          expenses,
          transactionState.categories,
          onboardingState,
        ),
    goalPreviews: buildDashboardGoalPreviews(
      incomeTotal,
      expenseTotal,
      onboardingState,
      taxExpenseAmount,
    ),
    recentActivity: buildDashboardRecentActivity(transactions),
    quickActions: getQuickActions(onboardingState.profileType),
    transactionCount: transactions.length,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
    pendingCount: transactions.filter((transaction) => transaction.status === "pending").length,
    focusAreas: [...onboardingState.focusAreas],
    latestTransactions: transactions
      .slice()
      .sort((left, right) => right.transactionDate.localeCompare(left.transactionDate))
      .slice(0, 5),
  };
}
