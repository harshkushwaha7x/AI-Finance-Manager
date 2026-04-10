export type FinancialInsightPromptContext = {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  periodLabel: string;
  metrics: {
    incomeTotal: number;
    expenseTotal: number;
    netCashflow: number;
    savingsRate: number;
    incomeChangePercent: number;
    expenseChangePercent: number;
    pendingCount: number;
    uncategorizedCount: number;
    recurringCount: number;
    recurringExpenseAmount: number;
    budgetWatchCount: number;
    budgetOverCount: number;
    goalDueSoonCount: number;
  };
  topExpenseCategories: Array<{
    label: string;
    amount: number;
    sharePercent: number;
  }>;
  watchBudgets: Array<{
    name: string;
    utilizationPercent: number;
    remainingAmount: number;
  }>;
  dueSoonGoals: Array<{
    title: string;
    remainingAmount: number;
    daysRemaining: number | null;
  }>;
};

export const financialInsightsDeveloperPrompt = `
You generate concise AI financial insights for an India-first finance workspace.
Use the provided finance context only.
Return practical, grounded analysis with clear actions.
Do not mention that you are an AI.
Do not claim guarantees or legal/tax certainty.
If confidence is limited, be cautious and specific.
Keep the summary crisp and recruiter-quality.
`.trim();

export function buildFinancialInsightsPrompt(context: FinancialInsightPromptContext) {
  return [
    `Workspace: ${context.workspaceName}`,
    `Profile type: ${context.profileType}`,
    `Analysis period: ${context.periodLabel}`,
    "Metrics:",
    `- Income total: INR ${context.metrics.incomeTotal.toFixed(2)}`,
    `- Expense total: INR ${context.metrics.expenseTotal.toFixed(2)}`,
    `- Net cashflow: INR ${context.metrics.netCashflow.toFixed(2)}`,
    `- Savings rate: ${context.metrics.savingsRate.toFixed(1)}%`,
    `- Income change vs previous period: ${context.metrics.incomeChangePercent.toFixed(1)}%`,
    `- Expense change vs previous period: ${context.metrics.expenseChangePercent.toFixed(1)}%`,
    `- Pending transactions: ${context.metrics.pendingCount}`,
    `- Uncategorized transactions: ${context.metrics.uncategorizedCount}`,
    `- Recurring transactions: ${context.metrics.recurringCount}`,
    `- Recurring expense amount: INR ${context.metrics.recurringExpenseAmount.toFixed(2)}`,
    `- Budgets on watch: ${context.metrics.budgetWatchCount}`,
    `- Budgets over limit: ${context.metrics.budgetOverCount}`,
    `- Goals due soon: ${context.metrics.goalDueSoonCount}`,
    "Top expense categories:",
    ...(context.topExpenseCategories.length
      ? context.topExpenseCategories.map(
          (category) =>
            `- ${category.label}: INR ${category.amount.toFixed(2)} (${category.sharePercent.toFixed(1)}%)`,
        )
      : ["- No meaningful expense concentration found"]),
    "Budget pressure:",
    ...(context.watchBudgets.length
      ? context.watchBudgets.map(
          (budget) =>
            `- ${budget.name}: ${budget.utilizationPercent.toFixed(1)}% used, INR ${budget.remainingAmount.toFixed(2)} remaining`,
        )
      : ["- No budgets are currently under pressure"]),
    "Goals due soon:",
    ...(context.dueSoonGoals.length
      ? context.dueSoonGoals.map(
          (goal) =>
            `- ${goal.title}: INR ${goal.remainingAmount.toFixed(2)} left, ${goal.daysRemaining ?? "no deadline"} days remaining`,
        )
      : ["- No urgent active goals right now"]),
    "Generate:",
    "- one short summary paragraph",
    "- anomalies, risks, opportunities, and actions as short bullet-style strings",
    "- 2 to 4 savings suggestions with realistic INR estimates",
  ].join("\n");
}
