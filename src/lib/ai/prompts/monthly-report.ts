import type { MonthlyReportResponse, ReportRequest } from "@/types/finance";

export type MonthlyReportPromptContext = {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  periodLabel: string;
  reportType: ReportRequest["reportType"];
  report: MonthlyReportResponse;
};

export const monthlyReportDeveloperPrompt = `
You write premium finance report copy for an India-first AI finance workspace.
Use only the provided quantitative report context.
Keep the language crisp, executive, and practical.
Do not mention that you are an AI.
Do not invent transactions, compliance outcomes, or guarantees.
Return concise highlights, concise actions, and one polished narrative paragraph.
`.trim();

export function buildMonthlyReportPrompt(context: MonthlyReportPromptContext) {
  return [
    `Workspace: ${context.workspaceName}`,
    `Profile type: ${context.profileType}`,
    `Report type: ${context.reportType}`,
    `Period: ${context.periodLabel}`,
    "Totals:",
    `- Income: INR ${context.report.totals.income.toFixed(2)}`,
    `- Expenses: INR ${context.report.totals.expenses.toFixed(2)}`,
    `- Savings: INR ${context.report.totals.savings.toFixed(2)}`,
    "Transaction summary:",
    `- Transactions: ${context.report.transactionSummary.transactionCount}`,
    `- Income items: ${context.report.transactionSummary.incomeCount}`,
    `- Expense items: ${context.report.transactionSummary.expenseCount}`,
    `- Pending items: ${context.report.transactionSummary.pendingCount}`,
    `- Uncategorized items: ${context.report.transactionSummary.uncategorizedCount}`,
    `- Recurring items: ${context.report.transactionSummary.recurringCount}`,
    "Budget summary:",
    `- Total budgeted: INR ${context.report.budgetSummary.totalBudgeted.toFixed(2)}`,
    `- Total spent: INR ${context.report.budgetSummary.totalSpent.toFixed(2)}`,
    `- Total remaining: INR ${context.report.budgetSummary.totalRemaining.toFixed(2)}`,
    `- Watch budgets: ${context.report.budgetSummary.watchCount}`,
    `- Over budgets: ${context.report.budgetSummary.overCount}`,
    "Goal summary:",
    `- Active goals: ${context.report.goalSummary.activeCount}`,
    `- Completed goals: ${context.report.goalSummary.completedCount}`,
    `- Due soon goals: ${context.report.goalSummary.dueSoonCount}`,
    `- Funded amount: INR ${context.report.goalSummary.fundedAmount.toFixed(2)}`,
    `- Target amount: INR ${context.report.goalSummary.targetAmount.toFixed(2)}`,
    "Top categories:",
    ...(context.report.topCategories.length
      ? context.report.topCategories.map(
          (category) =>
            `- ${category.label}: INR ${category.amount.toFixed(2)} (${category.sharePercent.toFixed(1)}%)`,
        )
      : ["- No dominant category concentration in the selected period"]),
    "Cashflow checkpoints:",
    ...(context.report.cashflowTrend.length
      ? context.report.cashflowTrend
          .slice(-8)
          .map(
            (point) =>
              `- ${point.date}: income INR ${point.income.toFixed(2)}, expenses INR ${point.expenses.toFixed(2)}, net INR ${point.netCashflow.toFixed(2)}`,
          )
      : ["- No cashflow points available"]),
    "Generate:",
    "- 3 to 4 short highlights",
    "- 3 to 4 short actions",
    "- one narrative paragraph that sounds like a startup finance report",
  ].join("\n");
}
