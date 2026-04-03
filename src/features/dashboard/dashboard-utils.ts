import {
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionSourceLabel,
  formatTransactionTypeLabel,
} from "@/features/transactions/transaction-utils";
import type { OnboardingState } from "@/lib/onboarding/server";
import type {
  DashboardActivityItem,
  DashboardBudgetComparisonPoint,
  DashboardCashflowPoint,
  DashboardGoalPreview,
  DashboardMetricCard,
  DashboardSpendDistributionPoint,
} from "@/types/dashboard";
import type { TransactionCategoryOption, TransactionRecord } from "@/types/finance";

function formatCompactAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100000 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getMonthStart(date: Date) {
  const value = new Date(date.getFullYear(), date.getMonth(), 1);
  value.setHours(0, 0, 0, 0);

  return value;
}

function getMonthsAgoDate(monthsAgo: number) {
  const value = new Date();
  value.setMonth(value.getMonth() - monthsAgo);

  return getMonthStart(value);
}

function toDate(transactionDate: string) {
  return new Date(`${transactionDate}T00:00:00`);
}

function getDateBounds(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function getChangePercent(current: number, previous: number) {
  if (previous === 0 && current === 0) {
    return 0;
  }

  if (previous === 0) {
    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function buildDeltaLabel(current: number, previous: number) {
  const changePercent = getChangePercent(current, previous);
  const rounded = Math.round(Math.abs(changePercent));
  const direction = changePercent >= 0 ? "+" : "-";

  return `${direction}${rounded}%`;
}

function getDeltaToneForIncome(current: number, previous: number) {
  return current >= previous ? ("success" as const) : ("warning" as const);
}

function getDeltaToneForExpense(current: number, previous: number) {
  return current <= previous ? ("success" as const) : ("warning" as const);
}

function getCurrentAndPreviousPeriodTotals(
  transactions: TransactionRecord[],
  type: TransactionRecord["type"],
) {
  const currentWindow = getDateBounds(30);
  const previousWindow = {
    start: new Date(currentWindow.start),
    end: new Date(currentWindow.start),
  };
  previousWindow.start.setDate(previousWindow.start.getDate() - 30);
  previousWindow.end.setDate(previousWindow.end.getDate() - 1);
  previousWindow.end.setHours(23, 59, 59, 999);

  const current = transactions
    .filter((transaction) => transaction.type === type)
    .filter((transaction) => {
      const date = toDate(transaction.transactionDate);
      return date >= currentWindow.start && date <= currentWindow.end;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);

  const previous = transactions
    .filter((transaction) => transaction.type === type)
    .filter((transaction) => {
      const date = toDate(transaction.transactionDate);
      return date >= previousWindow.start && date <= previousWindow.end;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);

  return { current, previous };
}

export function buildDashboardMetricCards(
  transactions: TransactionRecord[],
  onboardingState: OnboardingState,
): DashboardMetricCard[] {
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const netPosition = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (netPosition / incomeTotal) * 100 : 0;
  const budgetUsage =
    onboardingState.monthlyBudgetTarget > 0
      ? (expenseTotal / onboardingState.monthlyBudgetTarget) * 100
      : 0;
  const incomePeriods = getCurrentAndPreviousPeriodTotals(transactions, "income");
  const expensePeriods = getCurrentAndPreviousPeriodTotals(transactions, "expense");
  const pendingCount = transactions.filter((transaction) => transaction.status === "pending").length;

  return [
    {
      label: "Cash in",
      value: formatCompactAmount(incomeTotal),
      detail: "Combined cleared and pending incoming money in the live workspace.",
      delta: buildDeltaLabel(incomePeriods.current, incomePeriods.previous),
      deltaTone: getDeltaToneForIncome(incomePeriods.current, incomePeriods.previous),
    },
    {
      label: "Cash out",
      value: formatCompactAmount(expenseTotal),
      detail: "Current outgoing spend across operations, tax, and recurring commitments.",
      delta: buildDeltaLabel(expensePeriods.current, expensePeriods.previous),
      deltaTone: getDeltaToneForExpense(expensePeriods.current, expensePeriods.previous),
    },
    {
      label: "Net position",
      value: formatCompactAmount(netPosition),
      detail: "The current spread between income tracked and expenses recorded.",
      delta: formatPercent(savingsRate),
      deltaTone: netPosition >= 0 ? "success" : "danger",
    },
    {
      label: "Budget pulse",
      value: `${Math.round(budgetUsage)}%`,
      detail: pendingCount
        ? `${pendingCount} record${pendingCount === 1 ? "" : "s"} still need review before the month closes.`
        : "All current transactions are cleared and ready for the next planning layer.",
      delta:
        budgetUsage > 100
          ? "Over plan"
          : budgetUsage > 80
            ? "Watch"
            : "Healthy",
      deltaTone:
        budgetUsage > 100 ? "danger" : budgetUsage > 80 ? "warning" : "success",
    },
  ];
}

export function buildDashboardCashflowTrend(
  transactions: TransactionRecord[],
): DashboardCashflowPoint[] {
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = getMonthsAgoDate(5 - index);

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      inflow: 0,
      outflow: 0,
    };
  });

  for (const transaction of transactions) {
    const date = toDate(transaction.transactionDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = monthBuckets.find((item) => item.key === key);

    if (!bucket) {
      continue;
    }

    if (transaction.type === "income") {
      bucket.inflow += transaction.amount;
    }

    if (transaction.type === "expense") {
      bucket.outflow += transaction.amount;
    }
  }

  return monthBuckets.map(({ key, ...bucket }) => {
    void key;

    return bucket;
  });
}

export function buildDashboardSpendDistribution(
  expenses: TransactionRecord[],
): DashboardSpendDistributionPoint[] {
  const totalSpend = expenses.reduce((total, expense) => total + expense.amount, 0);
  const breakdown = new Map<string, number>();

  for (const expense of expenses) {
    breakdown.set(
      expense.categoryLabel,
      (breakdown.get(expense.categoryLabel) ?? 0) + expense.amount,
    );
  }

  return Array.from(breakdown.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, amount]) => ({
      name,
      value: totalSpend ? Math.max(1, Math.round((amount / totalSpend) * 100)) : 0,
    }));
}

export function buildDashboardBudgetComparison(
  expenses: TransactionRecord[],
  categories: TransactionCategoryOption[],
  onboardingState: OnboardingState,
): DashboardBudgetComparisonPoint[] {
  const expenseTotals = new Map<string, number>();
  const totalSpend = expenses.reduce((total, expense) => total + expense.amount, 0);

  for (const expense of expenses) {
    expenseTotals.set(
      expense.categoryLabel,
      (expenseTotals.get(expense.categoryLabel) ?? 0) + expense.amount,
    );
  }

  const topCategories = Array.from(expenseTotals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  const totalTopSpend = topCategories.reduce((total, [, amount]) => total + amount, 0);
  const effectiveBudget =
    onboardingState.monthlyBudgetTarget > 0
      ? onboardingState.monthlyBudgetTarget
      : totalSpend || 1;

  return topCategories.map(([category, actual]) => {
    const normalizedShare = totalTopSpend > 0 ? actual / totalTopSpend : 0.25;
    const categoryColor =
      categories.find((item) => item.label === category)?.color ?? "#94a3b8";
    void categoryColor;
    const planned = Math.max(1, Math.round(effectiveBudget * normalizedShare));
    const ratio = planned > 0 ? actual / planned : 0;

    return {
      category,
      planned,
      actual,
      status: ratio > 1 ? "over" : ratio > 0.8 ? "watch" : "healthy",
    };
  });
}

export function buildDashboardGoalPreviews(
  incomeTotal: number,
  expenseTotal: number,
  onboardingState: OnboardingState,
  taxExpenseAmount: number,
): DashboardGoalPreview[] {
  const netPosition = Math.max(incomeTotal - expenseTotal, 0);
  const monthlySavingsTarget = Math.max(
    onboardingState.monthlyIncomeTarget - onboardingState.monthlyBudgetTarget,
    Math.round(onboardingState.monthlyIncomeTarget * 0.2),
    10000,
  );
  const runwayTarget = Math.max(onboardingState.monthlyBudgetTarget * 3, 50000);
  const taxReserveTarget = Math.max(
    onboardingState.profileType === "personal"
      ? Math.round(incomeTotal * 0.1)
      : Math.round(incomeTotal * 0.18),
    12000,
  );

  return [
    {
      title: "Monthly savings target",
      description:
        "A preview goal built from live income and expense totals until the dedicated goals module lands.",
      current: netPosition,
      target: monthlySavingsTarget,
      unitLabel: "saved",
      tone: netPosition >= monthlySavingsTarget ? "success" : "warning",
    },
    {
      title: "Tax reserve",
      description: "Tracks how much of your visible tax-ready buffer is already set aside in the ledger.",
      current: taxExpenseAmount,
      target: taxReserveTarget,
      unitLabel: "reserved",
      tone: taxExpenseAmount >= taxReserveTarget ? "success" : "secondary",
    },
    {
      title: "Runway buffer",
      description: "A simple runway-oriented target to keep the portfolio story grounded in operating safety.",
      current: Math.max(netPosition * 2, Math.round(onboardingState.monthlyBudgetTarget * 0.8)),
      target: runwayTarget,
      unitLabel: "buffered",
      tone: netPosition > 0 ? "secondary" : "warning",
    },
  ];
}

export function buildDashboardRecentActivity(
  transactions: TransactionRecord[],
): DashboardActivityItem[] {
  return [...transactions]
    .sort((left, right) => right.transactionDate.localeCompare(left.transactionDate))
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      detail: `${transaction.categoryLabel} • ${formatTransactionSourceLabel(transaction.source)} • ${formatTransactionTypeLabel(transaction.type)}`,
      badge: transaction.status === "pending" ? "Pending" : "Cleared",
      badgeTone: transaction.status === "pending" ? "warning" : "success",
      amountLabel:
        transaction.type === "income"
          ? `+${formatTransactionAmount(transaction.amount, transaction.currency)}`
          : `-${formatTransactionAmount(transaction.amount, transaction.currency)}`,
      dateLabel: formatTransactionDate(transaction.transactionDate),
    }));
}
