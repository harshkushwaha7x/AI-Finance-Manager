import "server-only";

import { ReportFormat, ReportStatus, ReportType } from "@prisma/client";
import { cookies } from "next/headers";

import { generateFinancialInsightsWithOpenAI } from "@/lib/ai/financial-insights";
import type { FinancialInsightPromptContext } from "@/lib/ai/prompts/financial-insights";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getBudgetWorkspaceState } from "@/lib/services/budgets";
import { getGoalWorkspaceState } from "@/lib/services/goals";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import {
  insightHistoryRecordSchema,
  insightResponseSchema,
  insightWorkspaceStateSchema,
} from "@/lib/validations/finance";
import type {
  BudgetRecord,
  GoalRecord,
  InsightHistoryRecord,
  InsightResponse,
  InsightSuggestionItem,
  InsightWorkspaceState,
  TransactionRecord,
} from "@/types/finance";

export const insightHistoryCookieName = "afm-insight-history";

type InsightGenerationResult = InsightWorkspaceState & {
  persistedHistory: InsightHistoryRecord[];
};

type InsightContextBundle = {
  promptContext: FinancialInsightPromptContext;
  periodStart: string;
  periodEnd: string;
};

function getPeriodBounds(days = 30) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPeriodLabel(start: Date, end: Date) {
  const formattedStart = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(start);
  const formattedEnd = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(end);

  return `${formattedStart} - ${formattedEnd}`;
}

function calculateChangePercent(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return 0;
  }

  if (previous === 0) {
    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function normalizeCurrencyEstimate(value: number) {
  return Math.max(500, Math.round(value / 100) * 100);
}

function uniqueItems(items: string[], limit = 4) {
  return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function getTotalEstimatedSavings(suggestions: InsightSuggestionItem[]) {
  return suggestions.reduce((total, suggestion) => total + suggestion.estimatedSavings, 0);
}

function buildTopExpenseCategories(expenses: TransactionRecord[]) {
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  const breakdown = new Map<string, number>();

  for (const expense of expenses) {
    breakdown.set(expense.categoryLabel, (breakdown.get(expense.categoryLabel) ?? 0) + expense.amount);
  }

  return Array.from(breakdown.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, amount]) => ({
      label,
      amount,
      sharePercent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }));
}

function buildInsightContextBundle(
  workspaceName: string,
  profileType: FinancialInsightPromptContext["profileType"],
  transactions: TransactionRecord[],
  budgets: BudgetRecord[],
  goals: GoalRecord[],
): InsightContextBundle {
  const currentBounds = getPeriodBounds(30);
  const previousBounds = {
    start: new Date(currentBounds.start),
    end: new Date(currentBounds.start),
  };
  previousBounds.start.setDate(previousBounds.start.getDate() - 30);
  previousBounds.end.setDate(previousBounds.end.getDate() - 1);
  previousBounds.end.setHours(23, 59, 59, 999);

  const currentTransactions = transactions.filter((transaction) => {
    const date = toDate(transaction.transactionDate);
    return date >= currentBounds.start && date <= currentBounds.end;
  });
  const previousTransactions = transactions.filter((transaction) => {
    const date = toDate(transaction.transactionDate);
    return date >= previousBounds.start && date <= previousBounds.end;
  });
  const currentIncome = currentTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const currentExpenses = currentTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const previousIncome = previousTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const previousExpenses = previousTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const currentExpenseRecords = currentTransactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const recurringExpenseAmount = currentExpenseRecords
    .filter((transaction) => transaction.recurring)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const watchBudgets = budgets
    .filter((budget) => budget.status !== "healthy")
    .sort((left, right) => right.utilizationPercent - left.utilizationPercent)
    .slice(0, 4)
    .map((budget) => ({
      name: budget.name,
      utilizationPercent: budget.utilizationPercent,
      remainingAmount: budget.remainingAmount,
    }));
  const dueSoonGoals = goals
    .filter((goal) => goal.status === "active" && goal.daysRemaining !== null && goal.daysRemaining <= 45)
    .sort((left, right) => (left.daysRemaining ?? 999) - (right.daysRemaining ?? 999))
    .slice(0, 4)
    .map((goal) => ({
      title: goal.title,
      remainingAmount: goal.remainingAmount,
      daysRemaining: goal.daysRemaining,
    }));

  return {
    periodStart: formatDateString(currentBounds.start),
    periodEnd: formatDateString(currentBounds.end),
    promptContext: {
      workspaceName,
      profileType,
      periodLabel: formatPeriodLabel(currentBounds.start, currentBounds.end),
      metrics: {
        incomeTotal: currentIncome,
        expenseTotal: currentExpenses,
        netCashflow: currentIncome - currentExpenses,
        savingsRate: currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0,
        incomeChangePercent: calculateChangePercent(currentIncome, previousIncome),
        expenseChangePercent: calculateChangePercent(currentExpenses, previousExpenses),
        pendingCount: currentTransactions.filter((transaction) => transaction.status === "pending").length,
        uncategorizedCount: currentTransactions.filter(
          (transaction) => transaction.type !== "transfer" && !transaction.categoryId,
        ).length,
        recurringCount: currentTransactions.filter((transaction) => transaction.recurring).length,
        recurringExpenseAmount,
        budgetWatchCount: budgets.filter((budget) => budget.status === "watch").length,
        budgetOverCount: budgets.filter((budget) => budget.status === "over").length,
        goalDueSoonCount: dueSoonGoals.length,
      },
      topExpenseCategories: buildTopExpenseCategories(currentExpenseRecords),
      watchBudgets,
      dueSoonGoals,
    },
  };
}

function buildFallbackInsights(context: FinancialInsightPromptContext): InsightResponse {
  const biggestCategory = context.topExpenseCategories[0];
  const summaryLead =
    context.metrics.netCashflow >= 0
      ? `${context.workspaceName} is still cashflow-positive for ${context.periodLabel}, but spending pressure is becoming concentrated.`
      : `${context.workspaceName} is running negative cashflow for ${context.periodLabel}, so the next actions should focus on immediate cost control.`;
  const summaryFollowUp =
    context.metrics.budgetOverCount > 0
      ? `${context.metrics.budgetOverCount} budget lane${context.metrics.budgetOverCount === 1 ? " is" : "s are"} already over plan, which makes short-term discipline more important than broad optimization.`
      : biggestCategory
        ? `${biggestCategory.label} is the clearest spend driver right now, so even a modest trim there would move the month meaningfully.`
        : "There is enough activity to generate planning signals, but the biggest win is better categorization discipline before deeper optimization.";

  const anomalies = uniqueItems([
    biggestCategory && biggestCategory.sharePercent >= 35
      ? `${biggestCategory.label} is driving ${Math.round(biggestCategory.sharePercent)}% of visible expense activity.`
      : "",
    context.metrics.expenseChangePercent >= 18
      ? `Expenses are up ${Math.round(context.metrics.expenseChangePercent)}% versus the previous 30-day period.`
      : "",
    context.metrics.pendingCount >= 2
      ? `${context.metrics.pendingCount} transactions still need reconciliation before the picture is fully clean.`
      : "",
    context.metrics.uncategorizedCount > 0
      ? `${context.metrics.uncategorizedCount} transaction${context.metrics.uncategorizedCount === 1 ? "" : "s"} remain uncategorized.`
      : "",
  ]);

  const risks = uniqueItems([
    context.metrics.budgetOverCount > 0
      ? `${context.metrics.budgetOverCount} budgets are over their limits and can compound quickly if left untouched.`
      : "",
    context.metrics.savingsRate < 15
      ? `The current savings rate is only ${Math.round(context.metrics.savingsRate)}%, which leaves less margin for goals and reserves.`
      : "",
    context.metrics.goalDueSoonCount > 0
      ? `${context.metrics.goalDueSoonCount} active goal${context.metrics.goalDueSoonCount === 1 ? "" : "s"} are due soon and may need dedicated funding.`
      : "",
    context.metrics.recurringExpenseAmount > 0
      ? `Recurring expense commitments already account for INR ${context.metrics.recurringExpenseAmount.toFixed(0)} this period.`
      : "",
  ]);

  const opportunities = uniqueItems([
    biggestCategory
      ? `${biggestCategory.label} is the highest-leverage category for a fast savings improvement.`
      : "",
    context.watchBudgets.length
      ? `Budget pressure is concentrated in ${context.watchBudgets
          .slice(0, 2)
          .map((budget) => budget.name)
          .join(" and ")}, so targeted action can work better than broad cuts.`
      : "",
    context.metrics.incomeChangePercent > 0
      ? `Income is trending up ${Math.round(context.metrics.incomeChangePercent)}% versus the previous period, which creates room for reserve-building.`
      : "",
    context.metrics.uncategorizedCount > 0
      ? "Cleaning uncategorized transactions will improve the accuracy of later reports and alerts."
      : "",
  ]);

  const actions = uniqueItems([
    biggestCategory
      ? `Review the top ${biggestCategory.label} transactions first and cut or renegotiate at least one line item this week.`
      : "Review the highest-value expense transactions and tag any avoidable or one-off costs.",
    context.watchBudgets.length
      ? `Set a spending cap on ${context.watchBudgets[0].name} until usage drops back below the alert threshold.`
      : "Keep an eye on the next 7 to 10 days of spend so the current trend does not drift upward.",
    context.metrics.uncategorizedCount > 0
      ? `Clear the uncategorized queue so the dashboard and next reports stay decision-grade.`
      : "Refresh AI insights after the next batch of transactions to confirm whether the current trend is holding.",
    context.dueSoonGoals.length
      ? `Allocate a fixed transfer toward ${context.dueSoonGoals[0].title} before its deadline gets tighter.`
      : "Channel the next positive cashflow surplus into reserves before increasing discretionary spend.",
  ]);

  const suggestions: InsightSuggestionItem[] = [];

  if (biggestCategory) {
    suggestions.push({
      title: `Trim ${biggestCategory.label} by one deliberate cut`,
      rationale: `A small 8% reduction in the top spend lane would create a visible improvement without requiring a full budget rewrite.`,
      estimatedSavings: normalizeCurrencyEstimate(biggestCategory.amount * 0.08),
      priority: biggestCategory.sharePercent >= 35 ? "high" : "medium",
    });
  }

  if (context.metrics.recurringExpenseAmount > 0) {
    suggestions.push({
      title: "Audit recurring subscriptions and renewals",
      rationale: "Recurring expenses are easier to optimize because they repeat automatically and usually need only one decision.",
      estimatedSavings: normalizeCurrencyEstimate(context.metrics.recurringExpenseAmount * 0.05),
      priority: "medium",
    });
  }

  if (context.watchBudgets.length) {
    const stressedBudget = context.watchBudgets[0];
    suggestions.push({
      title: `Stabilize ${stressedBudget.name}`,
      rationale: `This budget is already under pressure, so a targeted correction here is likely to outperform broad cost-cutting elsewhere.`,
      estimatedSavings: normalizeCurrencyEstimate(Math.max(stressedBudget.remainingAmount * -1, 1500)),
      priority: stressedBudget.utilizationPercent > 100 ? "high" : "medium",
    });
  }

  if (suggestions.length < 2) {
    suggestions.push({
      title: "Create a weekly expense review habit",
      rationale: "Shorter review loops usually reduce drift before it becomes a month-end problem.",
      estimatedSavings: normalizeCurrencyEstimate(Math.max(context.metrics.expenseTotal * 0.03, 1000)),
      priority: "low",
    });
  }

  return insightResponseSchema.parse({
    summary: `${summaryLead} ${summaryFollowUp}`,
    anomalies,
    risks,
    opportunities,
    actions,
    suggestions: suggestions.slice(0, 4),
  });
}

function createInsightHistoryRecord(params: {
  id?: string;
  generatedAt?: string;
  periodLabel: string;
  source: InsightHistoryRecord["source"];
  response: InsightResponse;
}) {
  return insightHistoryRecordSchema.parse({
    id: params.id ?? crypto.randomUUID(),
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    periodLabel: params.periodLabel,
    source: params.source,
    response: params.response,
    totalEstimatedSavings: getTotalEstimatedSavings(params.response.suggestions),
  });
}

async function getDatabaseContext(viewer: ViewerContext) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: viewer.email },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return {
      prisma,
      userId: user.id,
    };
  } catch {
    return null;
  }
}

async function readDemoInsightHistory() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(insightHistoryCookieName)?.value;

  if (!rawValue) {
    return [] satisfies InsightHistoryRecord[];
  }

  try {
    return insightHistoryRecordSchema.array().parse(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

async function readDatabaseInsightHistory(
  viewer: ViewerContext,
): Promise<InsightHistoryRecord[] | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const reports = await context.prisma.report.findMany({
    where: {
      userId: context.userId,
      reportType: ReportType.CUSTOM,
      format: ReportFormat.JSON,
      status: ReportStatus.READY,
    },
    select: {
      id: true,
      payload: true,
      generatedAt: true,
      createdAt: true,
    },
    orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  return reports
    .map((report) => {
      if (!report.payload || typeof report.payload !== "object") {
        return null;
      }

      const payload = report.payload as Record<string, unknown>;

      if (payload.kind !== "ai_insight_snapshot") {
        return null;
      }

      try {
        return createInsightHistoryRecord({
          id: report.id,
          generatedAt:
            report.generatedAt?.toISOString() ?? report.createdAt.toISOString(),
          periodLabel:
            typeof payload.periodLabel === "string" ? payload.periodLabel : "Recent period",
          source: payload.source === "openai" ? "openai" : "fallback",
          response: insightResponseSchema.parse(payload.response),
        });
      } catch {
        return null;
      }
    })
    .filter((record): record is InsightHistoryRecord => Boolean(record));
}

async function generateFreshInsightRecord(
  viewer: ViewerContext,
  preferOpenAI: boolean,
) {
  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const budgetState = await getBudgetWorkspaceState(viewer);
  const goalState = await getGoalWorkspaceState(viewer);
  const workspaceName =
    onboardingState.workspaceName || viewer.name || "Finance workspace";
  const contextBundle = buildInsightContextBundle(
    workspaceName,
    onboardingState.profileType,
    transactionState.transactions,
    budgetState.budgets,
    goalState.goals,
  );
  const openAIResponse = preferOpenAI
    ? await generateFinancialInsightsWithOpenAI(contextBundle.promptContext)
    : null;
  const response = openAIResponse ?? buildFallbackInsights(contextBundle.promptContext);
  const source = openAIResponse ? ("openai" as const) : ("fallback" as const);

  return {
    periodStart: contextBundle.periodStart,
    periodEnd: contextBundle.periodEnd,
    record: createInsightHistoryRecord({
      periodLabel: contextBundle.promptContext.periodLabel,
      source,
      response,
    }),
  };
}

async function persistDatabaseInsightRecord(
  viewer: ViewerContext,
  record: InsightHistoryRecord,
  periodStart: string,
  periodEnd: string,
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.report.create({
    data: {
      userId: context.userId,
      reportType: ReportType.CUSTOM,
      periodStart: new Date(`${periodStart}T00:00:00.000Z`),
      periodEnd: new Date(`${periodEnd}T00:00:00.000Z`),
      format: ReportFormat.JSON,
      status: ReportStatus.READY,
      payload: {
        kind: "ai_insight_snapshot",
        source: record.source,
        periodLabel: record.periodLabel,
        response: record.response,
        totalEstimatedSavings: record.totalEstimatedSavings,
      },
      generatedAt: new Date(record.generatedAt),
    },
    select: {
      id: true,
      generatedAt: true,
    },
  });

  return createInsightHistoryRecord({
    id: created.id,
    generatedAt: created.generatedAt?.toISOString() ?? record.generatedAt,
    periodLabel: record.periodLabel,
    source: record.source,
    response: record.response,
  });
}

export function getInsightCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getInsightWorkspaceState(
  viewer: ViewerContext,
): Promise<InsightWorkspaceState> {
  const databaseHistory = await readDatabaseInsightHistory(viewer);

  if (databaseHistory && databaseHistory.length) {
    return insightWorkspaceStateSchema.parse({
      current: databaseHistory[0],
      history: databaseHistory,
      source: "database",
    });
  }

  const demoHistory = await readDemoInsightHistory();

  if (demoHistory.length) {
    return insightWorkspaceStateSchema.parse({
      current: demoHistory[0],
      history: demoHistory,
      source: "demo",
    });
  }

  const generated = await generateFreshInsightRecord(viewer, false);

  return insightWorkspaceStateSchema.parse({
    current: generated.record,
    history: [],
    source: appEnv.hasDatabase && viewer.isSignedIn ? "database" : "demo",
  });
}

export async function generateInsightSnapshot(
  viewer: ViewerContext,
): Promise<InsightGenerationResult> {
  const generated = await generateFreshInsightRecord(viewer, true);
  const databasePersistedRecord = await persistDatabaseInsightRecord(
    viewer,
    generated.record,
    generated.periodStart,
    generated.periodEnd,
  );

  if (databasePersistedRecord) {
    const history = await readDatabaseInsightHistory(viewer);
    const safeHistory = history ?? [databasePersistedRecord];

    return {
      current: safeHistory[0],
      history: safeHistory,
      source: "database",
      persistedHistory: [],
    };
  }

  const existingHistory = await readDemoInsightHistory();
  const persistedHistory = [generated.record, ...existingHistory].slice(0, 8);

  return {
    current: persistedHistory[0],
    history: persistedHistory,
    source: "demo",
    persistedHistory,
  };
}

export function getSerializedInsightHistoryCookie(history: InsightHistoryRecord[]) {
  return JSON.stringify(insightHistoryRecordSchema.array().parse(history));
}
