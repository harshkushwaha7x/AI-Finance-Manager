import "server-only";

import { ReportFormat, ReportStatus, ReportType } from "@prisma/client";
import { cookies } from "next/headers";

import { generateMonthlyReportCopyWithOpenAI } from "@/lib/ai/monthly-report";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getBudgetWorkspaceState } from "@/lib/services/budgets";
import { getGoalWorkspaceState } from "@/lib/services/goals";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import {
  monthlyReportResponseSchema,
  reportHistoryRecordSchema,
  reportRequestSchema,
  reportWorkspaceStateSchema,
} from "@/lib/validations/finance";
import type {
  BudgetWorkspaceState,
  GoalWorkspaceState,
  MonthlyReportResponse,
  ReportHistoryRecord,
  ReportRequest,
  ReportWorkspaceState,
  TransactionRecord,
  TransactionWorkspaceState,
} from "@/types/finance";

export const reportHistoryCookieName = "afm-report-history";

type ReportGenerationResult = ReportWorkspaceState & {
  persistedHistory: ReportHistoryRecord[];
};

type ResolvedReportContext = {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  request: ReportRequest;
  periodLabel: string;
  report: MonthlyReportResponse;
};

function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatPeriodLabel(periodStart: string, periodEnd: string) {
  return `${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(toDate(periodStart))} - ${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(toDate(periodEnd))}`;
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : "";
}

function uniqueItems(items: string[], limit = 4) {
  return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function getDefaultReportRequest(): ReportRequest {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);

  return {
    reportType: "monthly_summary",
    format: "pdf",
    periodStart: formatDateString(start),
    periodEnd: formatDateString(end),
  };
}

function getReportTypeLead(reportType: ReportRequest["reportType"]) {
  switch (reportType) {
    case "cashflow":
      return "Cashflow report";
    case "budget":
      return "Budget health report";
    case "tax":
      return "Tax prep report";
    case "custom":
      return "Custom finance report";
    default:
      return "Monthly finance report";
  }
}

function filterTransactionsByPeriod(
  transactions: TransactionRecord[],
  periodStart: string,
  periodEnd: string,
) {
  return transactions.filter(
    (transaction) =>
      transaction.transactionDate >= periodStart && transaction.transactionDate <= periodEnd,
  );
}

function buildCashflowTrend(
  transactions: TransactionRecord[],
  periodStart: string,
  periodEnd: string,
) {
  const trendMap = new Map<
    string,
    {
      income: number;
      expenses: number;
    }
  >();
  const cursor = toDate(periodStart);
  const lastDate = toDate(periodEnd);

  while (cursor <= lastDate) {
    trendMap.set(formatDateString(cursor), { income: 0, expenses: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const transaction of transactions) {
    const bucket = trendMap.get(transaction.transactionDate);

    if (!bucket) {
      continue;
    }

    if (transaction.type === "income") {
      bucket.income += transaction.amount;
    } else if (transaction.type === "expense") {
      bucket.expenses += transaction.amount;
    }
  }

  return Array.from(trendMap.entries()).map(([date, values]) => ({
    date,
    income: values.income,
    expenses: values.expenses,
    netCashflow: values.income - values.expenses,
  }));
}

function buildTopCategories(expenses: TransactionRecord[]) {
  const total = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
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
      sharePercent: total > 0 ? (amount / total) * 100 : 0,
    }));
}

function buildFallbackNarrative(params: {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  reportType: ReportRequest["reportType"];
  periodLabel: string;
  incomeTotal: number;
  expenseTotal: number;
  savingsTotal: number;
  topCategories: MonthlyReportResponse["topCategories"];
  pendingCount: number;
  uncategorizedCount: number;
  budgetWatchCount: number;
  budgetOverCount: number;
  goalDueSoonCount: number;
}) {
  const reportLead = `${getReportTypeLead(params.reportType)} for ${params.workspaceName}`;
  const profileNote =
    params.profileType === "business"
      ? "The operating picture shows how spending discipline and reserve planning are affecting business control."
      : params.profileType === "freelancer"
        ? "The report is especially useful for balancing client cash-in, recurring tools, and tax readiness."
        : "The summary stays focused on personal cashflow quality, spending concentration, and savings momentum.";
  const categoryNote = params.topCategories[0]
    ? `${params.topCategories[0].label} is the largest visible expense lane at ${Math.round(params.topCategories[0].sharePercent)}% of tracked spend.`
    : "No single spend lane dominates the selected period yet.";
  const riskNote =
    params.budgetOverCount > 0
      ? `${params.budgetOverCount} budget lane${params.budgetOverCount === 1 ? " is" : "s are"} already over plan, which makes near-term restraint more important than broad optimization.`
      : params.pendingCount > 0
        ? `${params.pendingCount} pending transaction${params.pendingCount === 1 ? "" : "s"} still need reconciliation before the reporting picture is fully clean.`
        : params.uncategorizedCount > 0
          ? `${params.uncategorizedCount} uncategorized transaction${params.uncategorizedCount === 1 ? "" : "s"} are reducing reporting accuracy and should be cleaned up next.`
          : "The current ledger is clean enough to use for practical planning and accountant handoff.";
  const goalNote =
    params.goalDueSoonCount > 0
      ? `${params.goalDueSoonCount} active goal${params.goalDueSoonCount === 1 ? "" : "s"} are due soon, so reserve allocation should stay intentional.`
      : "Goal pressure is manageable, so any surplus can be directed toward savings quality rather than emergency correction.";

  return `${reportLead} covers ${params.periodLabel}. Income closed at INR ${params.incomeTotal.toFixed(0)}, expenses landed at INR ${params.expenseTotal.toFixed(0)}, and net savings finished at INR ${params.savingsTotal.toFixed(0)}. ${profileNote} ${categoryNote} ${riskNote} ${goalNote}`;
}

function buildFallbackReport(params: {
  workspaceName: string;
  profileType: "personal" | "freelancer" | "business";
  request: ReportRequest;
  transactions: TransactionWorkspaceState["transactions"];
  budgetState: BudgetWorkspaceState;
  goalState: GoalWorkspaceState;
}) {
  const scopedTransactions = filterTransactionsByPeriod(
    params.transactions,
    params.request.periodStart,
    params.request.periodEnd,
  );
  const incomes = scopedTransactions.filter((transaction) => transaction.type === "income");
  const expenses = scopedTransactions.filter((transaction) => transaction.type === "expense");
  const incomeTotal = incomes.reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseTotal = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const savingsTotal = incomeTotal - expenseTotal;
  const topCategories = buildTopCategories(expenses);
  const budgetSummary = {
    totalBudgeted: params.budgetState.summary.totalBudgeted,
    totalSpent: params.budgetState.summary.totalSpent,
    totalRemaining: params.budgetState.summary.totalRemaining,
    activeCount: params.budgetState.summary.activeCount,
    watchCount: params.budgetState.summary.watchCount,
    overCount: params.budgetState.summary.overCount,
  };
  const goalSummary = {
    activeCount: params.goalState.summary.activeCount,
    completedCount: params.goalState.summary.completedCount,
    dueSoonCount: params.goalState.summary.dueSoonCount,
    fundedAmount: params.goalState.goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    targetAmount: params.goalState.goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
  };
  const transactionSummary = {
    transactionCount: scopedTransactions.length,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
    pendingCount: scopedTransactions.filter((transaction) => transaction.status === "pending").length,
    uncategorizedCount: scopedTransactions.filter(
      (transaction) => transaction.type !== "transfer" && !transaction.categoryId,
    ).length,
    recurringCount: scopedTransactions.filter((transaction) => transaction.recurring).length,
  };
  const taxExpenseAmount = expenses
    .filter((transaction) => transaction.categoryLabel === "Tax")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const narrative = buildFallbackNarrative({
    workspaceName: params.workspaceName,
    profileType: params.profileType,
    reportType: params.request.reportType,
    periodLabel: formatPeriodLabel(params.request.periodStart, params.request.periodEnd),
    incomeTotal,
    expenseTotal,
    savingsTotal,
    topCategories,
    pendingCount: transactionSummary.pendingCount,
    uncategorizedCount: transactionSummary.uncategorizedCount,
    budgetWatchCount: budgetSummary.watchCount,
    budgetOverCount: budgetSummary.overCount,
    goalDueSoonCount: goalSummary.dueSoonCount,
  });
  const highlights = uniqueItems([
    topCategories[0]
      ? `${topCategories[0].label} accounts for ${Math.round(topCategories[0].sharePercent)}% of tracked spend in the selected period.`
      : "",
    savingsTotal >= 0
      ? `Net savings closed positive at INR ${savingsTotal.toFixed(0)}.`
      : `Net cashflow is negative by INR ${Math.abs(savingsTotal).toFixed(0)} and needs attention.`,
    budgetSummary.overCount > 0
      ? `${budgetSummary.overCount} budget lane${budgetSummary.overCount === 1 ? " is" : "s are"} already over limit.`
      : "",
    budgetSummary.watchCount > 0
      ? `${budgetSummary.watchCount} budget lane${budgetSummary.watchCount === 1 ? " is" : "s are"} nearing the alert threshold.`
      : "",
    transactionSummary.pendingCount > 0
      ? `${transactionSummary.pendingCount} transactions still need reconciliation.`
      : "",
    transactionSummary.uncategorizedCount > 0
      ? `${transactionSummary.uncategorizedCount} uncategorized transactions are reducing report accuracy.`
      : "",
    params.request.reportType === "tax" && taxExpenseAmount > 0
      ? `INR ${taxExpenseAmount.toFixed(0)} is already tagged against tax-related expense activity.`
      : "",
  ]);
  const actions = uniqueItems([
    topCategories[0]
      ? `Review the largest ${topCategories[0].label} entries first to find one near-term reduction.`
      : "Review the highest-value expenses and mark any avoidable or delayed items.",
    transactionSummary.uncategorizedCount > 0
      ? "Clear the uncategorized queue before sharing the report externally."
      : "Keep categorization current so future exports remain accountant-ready.",
    budgetSummary.overCount > 0
      ? "Correct overspent budgets immediately and freeze discretionary items inside those lanes."
      : "",
    goalSummary.dueSoonCount > 0
      ? "Schedule the next contribution toward due-soon goals before the next spending cycle."
      : "",
    params.request.reportType === "tax"
      ? "Use this report as a prep sheet, then verify final compliance decisions with an accountant."
      : "Share this report with stakeholders or use it as the next planning checkpoint.",
  ]);

  return monthlyReportResponseSchema.parse({
    reportType: params.request.reportType,
    periodStart: params.request.periodStart,
    periodEnd: params.request.periodEnd,
    totals: {
      income: incomeTotal,
      expenses: expenseTotal,
      savings: savingsTotal,
    },
    highlights,
    actions,
    topCategories,
    cashflowTrend: buildCashflowTrend(
      scopedTransactions,
      params.request.periodStart,
      params.request.periodEnd,
    ),
    budgetSummary,
    goalSummary,
    transactionSummary,
    narrative,
  });
}

function createReportHistoryRecord(params: {
  id?: string;
  generatedAt?: string;
  periodLabel: string;
  format: ReportHistoryRecord["format"];
  source: ReportHistoryRecord["source"];
  response: MonthlyReportResponse;
}) {
  return reportHistoryRecordSchema.parse({
    id: params.id ?? crypto.randomUUID(),
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    periodLabel: params.periodLabel,
    format: params.format,
    source: params.source,
    response: params.response,
  });
}

function mapReportTypeToPrisma(reportType: ReportRequest["reportType"]) {
  switch (reportType) {
    case "cashflow":
      return ReportType.CASHFLOW;
    case "budget":
      return ReportType.BUDGET;
    case "tax":
      return ReportType.TAX;
    case "custom":
      return ReportType.CUSTOM;
    default:
      return ReportType.MONTHLY_SUMMARY;
  }
}

function mapReportFormatToPrisma(format: ReportRequest["format"]) {
  switch (format) {
    case "csv":
      return ReportFormat.CSV;
    case "pdf":
      return ReportFormat.PDF;
    default:
      return ReportFormat.JSON;
  }
}

function mapPrismaReportFormat(format: ReportFormat): ReportHistoryRecord["format"] {
  if (format === ReportFormat.CSV) {
    return "csv";
  }

  if (format === ReportFormat.PDF) {
    return "pdf";
  }

  return "json";
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
      include: {
        businessProfiles: {
          select: { id: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      prisma,
      userId: user.id,
      businessProfileId: user.businessProfiles[0]?.id,
    };
  } catch {
    return null;
  }
}

async function readDemoReportHistory() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(reportHistoryCookieName)?.value;

  if (!rawValue) {
    return [] satisfies ReportHistoryRecord[];
  }

  try {
    return reportHistoryRecordSchema.array().parse(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

async function readDatabaseReportHistory(
  viewer: ViewerContext,
): Promise<ReportHistoryRecord[] | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const reports = await context.prisma.report.findMany({
    where: {
      userId: context.userId,
      status: ReportStatus.READY,
    },
    select: {
      id: true,
      payload: true,
      generatedAt: true,
      createdAt: true,
      format: true,
    },
    orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
    take: 12,
  });

  return reports
    .map((report) => {
      if (!report.payload || typeof report.payload !== "object") {
        return null;
      }

      const payload = report.payload as Record<string, unknown>;

      if (payload.kind !== "finance_report_snapshot") {
        return null;
      }

      try {
        return createReportHistoryRecord({
          id: report.id,
          generatedAt: report.generatedAt?.toISOString() ?? report.createdAt.toISOString(),
          periodLabel:
            typeof payload.periodLabel === "string" ? payload.periodLabel : "Selected period",
          format: mapPrismaReportFormat(report.format),
          source: payload.source === "openai" ? "openai" : "fallback",
          response: monthlyReportResponseSchema.parse(payload.response),
        });
      } catch {
        return null;
      }
    })
    .filter((report): report is ReportHistoryRecord => Boolean(report));
}

async function generateFreshReportRecord(
  viewer: ViewerContext,
  input: ReportRequest,
  preferOpenAI: boolean,
): Promise<ResolvedReportContext & { record: ReportHistoryRecord }> {
  const parsedRequest = reportRequestSchema.parse(input);
  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const budgetState = await getBudgetWorkspaceState(viewer);
  const goalState = await getGoalWorkspaceState(viewer);
  const workspaceName =
    onboardingState.workspaceName || viewer.name || "Finance workspace";
  const report = buildFallbackReport({
    workspaceName,
    profileType: onboardingState.profileType,
    request: parsedRequest,
    transactions: transactionState.transactions,
    budgetState,
    goalState,
  });
  const periodLabel = formatPeriodLabel(parsedRequest.periodStart, parsedRequest.periodEnd);
  const openAIEnhancement = preferOpenAI
    ? await generateMonthlyReportCopyWithOpenAI({
        workspaceName,
        profileType: onboardingState.profileType,
        periodLabel,
        reportType: parsedRequest.reportType,
        report,
      })
    : null;
  const response = monthlyReportResponseSchema.parse(
    openAIEnhancement
      ? {
          ...report,
          highlights: uniqueItems(openAIEnhancement.highlights, 4),
          actions: uniqueItems(openAIEnhancement.actions, 4),
          narrative: normalizeOptionalText(openAIEnhancement.narrative) || report.narrative,
        }
      : report,
  );
  const source = openAIEnhancement ? ("openai" as const) : ("fallback" as const);

  return {
    workspaceName,
    profileType: onboardingState.profileType,
    request: parsedRequest,
    periodLabel,
    report: response,
    record: createReportHistoryRecord({
      periodLabel,
      format: parsedRequest.format,
      source,
      response,
    }),
  };
}

async function persistDatabaseReportRecord(
  viewer: ViewerContext,
  generated: ResolvedReportContext & { record: ReportHistoryRecord },
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.report.create({
    data: {
      userId: context.userId,
      businessProfileId: context.businessProfileId,
      reportType: mapReportTypeToPrisma(generated.request.reportType),
      periodStart: new Date(`${generated.request.periodStart}T00:00:00.000Z`),
      periodEnd: new Date(`${generated.request.periodEnd}T00:00:00.000Z`),
      format: mapReportFormatToPrisma(generated.request.format),
      status: ReportStatus.READY,
      payload: {
        kind: "finance_report_snapshot",
        source: generated.record.source,
        periodLabel: generated.record.periodLabel,
        response: generated.record.response,
      },
      filePath: `reports/${generated.request.reportType}/${generated.record.id}.${generated.request.format === "json" ? "json" : generated.request.format}`,
      generatedAt: new Date(generated.record.generatedAt),
    },
    select: {
      id: true,
      generatedAt: true,
    },
  });

  return createReportHistoryRecord({
    id: created.id,
    generatedAt: created.generatedAt?.toISOString() ?? generated.record.generatedAt,
    periodLabel: generated.record.periodLabel,
    format: generated.record.format,
    source: generated.record.source,
    response: generated.record.response,
  });
}

export function getReportCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getReportWorkspaceState(
  viewer: ViewerContext,
): Promise<ReportWorkspaceState> {
  const databaseHistory = await readDatabaseReportHistory(viewer);

  if (databaseHistory && databaseHistory.length) {
    return reportWorkspaceStateSchema.parse({
      current: databaseHistory[0],
      history: databaseHistory,
      source: "database",
    });
  }

  const demoHistory = await readDemoReportHistory();

  if (demoHistory.length) {
    return reportWorkspaceStateSchema.parse({
      current: demoHistory[0],
      history: demoHistory,
      source: "demo",
    });
  }

  const generated = await generateFreshReportRecord(viewer, getDefaultReportRequest(), false);

  return reportWorkspaceStateSchema.parse({
    current: generated.record,
    history: [],
    source: appEnv.hasDatabase && viewer.isSignedIn ? "database" : "demo",
  });
}

export async function generateReportSnapshot(
  viewer: ViewerContext,
  input: ReportRequest,
): Promise<ReportGenerationResult> {
  const generated = await generateFreshReportRecord(viewer, input, true);
  const databasePersistedRecord = await persistDatabaseReportRecord(viewer, generated);

  if (databasePersistedRecord) {
    const history = await readDatabaseReportHistory(viewer);
    const safeHistory = history ?? [databasePersistedRecord];

    return {
      current: safeHistory[0],
      history: safeHistory,
      source: "database",
      persistedHistory: [],
    };
  }

  const existingHistory = await readDemoReportHistory();
  const persistedHistory = [generated.record, ...existingHistory].slice(0, 8);

  return {
    current: persistedHistory[0],
    history: persistedHistory,
    source: "demo",
    persistedHistory,
  };
}

export function getSerializedReportHistoryCookie(history: ReportHistoryRecord[]) {
  return JSON.stringify(reportHistoryRecordSchema.array().parse(history));
}
