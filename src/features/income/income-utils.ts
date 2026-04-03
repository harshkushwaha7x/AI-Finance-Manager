import {
  formatTransactionSourceLabel,
} from "@/features/transactions/transaction-utils";
import type {
  IncomePageFilters,
  IncomeSavedView,
  IncomeSavedViewId,
  IncomeSourceBreakdownItem,
  IncomeSummary,
  IncomeTrendPoint,
} from "@/types/income";
import type { TransactionCategoryOption, TransactionRecord } from "@/types/finance";

const sourceColors: Record<TransactionRecord["source"], string> = {
  manual: "#155eef",
  invoice: "#0f766e",
  ai: "#f79009",
  receipt: "#94a3b8",
};

function sortByDateDesc(left: TransactionRecord, right: TransactionRecord) {
  return right.transactionDate.localeCompare(left.transactionDate);
}

function getWeekStart(date: Date) {
  const value = new Date(date);
  const day = value.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  value.setDate(value.getDate() + difference);
  value.setHours(0, 0, 0, 0);

  return value;
}

function formatWeekLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function getIncomeCategories(categories: TransactionCategoryOption[]) {
  return categories.filter((category) => category.kind === "income");
}

export function getIncomeTransactions(transactions: TransactionRecord[]) {
  return transactions
    .filter((transaction) => transaction.type === "income")
    .sort(sortByDateDesc);
}

export function buildIncomeSourceBreakdown(
  incomes: TransactionRecord[],
): IncomeSourceBreakdownItem[] {
  const totalIncome = incomes.reduce((total, income) => total + income.amount, 0);
  const breakdownMap = new Map<TransactionRecord["source"], IncomeSourceBreakdownItem>();

  for (const income of incomes) {
    const existing = breakdownMap.get(income.source);

    if (existing) {
      existing.amount += income.amount;
      existing.count += 1;
      continue;
    }

    breakdownMap.set(income.source, {
      source: income.source,
      label: formatTransactionSourceLabel(income.source),
      amount: income.amount,
      share: 0,
      count: 1,
      color: sourceColors[income.source],
    });
  }

  return Array.from(breakdownMap.values())
    .sort((left, right) => right.amount - left.amount)
    .map((item) => ({
      ...item,
      share:
        totalIncome > 0 ? Math.max(1, Math.round((item.amount / totalIncome) * 100)) : 0,
    }));
}

export function buildIncomeSummary(
  incomes: TransactionRecord[],
  breakdown: IncomeSourceBreakdownItem[],
): IncomeSummary {
  const totalIncome = incomes.reduce((total, income) => total + income.amount, 0);
  const recurringIncome = incomes.filter((income) => income.recurring);
  const topSource = breakdown[0];

  return {
    totalIncome,
    averageIncome: incomes.length ? totalIncome / incomes.length : 0,
    recurringPipeline: recurringIncome.reduce((total, income) => total + income.amount, 0),
    recurringCount: recurringIncome.length,
    pendingCount: incomes.filter((income) => income.status === "pending").length,
    invoiceLinkedTotal: incomes
      .filter((income) => income.source === "invoice")
      .reduce((total, income) => total + income.amount, 0),
    topSourceLabel: topSource?.label ?? "No source data yet",
    topSourceAmount: topSource?.amount ?? 0,
  };
}

export function getRecurringIncome(incomes: TransactionRecord[]) {
  return incomes
    .filter((income) => income.recurring)
    .sort((left, right) => right.amount - left.amount);
}

export function applyIncomeSavedView(
  incomes: TransactionRecord[],
  viewId: IncomeSavedViewId,
) {
  if (viewId === "recurring") {
    return incomes.filter((income) => income.recurring);
  }

  if (viewId === "pending") {
    return incomes.filter((income) => income.status === "pending");
  }

  if (viewId === "invoice-linked") {
    return incomes.filter((income) => income.source === "invoice");
  }

  return incomes;
}

export function applyIncomePageFilters(
  incomes: TransactionRecord[],
  filters: IncomePageFilters,
) {
  return incomes.filter((income) => {
    if (filters.category !== "all" && income.categoryLabel !== filters.category) {
      return false;
    }

    if (filters.source !== "all" && income.source !== filters.source) {
      return false;
    }

    if (filters.dateFrom && income.transactionDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && income.transactionDate > filters.dateTo) {
      return false;
    }

    return true;
  });
}

export function buildIncomeSavedViews(incomes: TransactionRecord[]): IncomeSavedView[] {
  return [
    {
      id: "all",
      label: "All income",
      description: "Every cash-in event currently tracked in the ledger.",
      count: incomes.length,
    },
    {
      id: "recurring",
      label: "Recurring",
      description: "Retainers, salary-like credits, and repeat inflows.",
      count: incomes.filter((income) => income.recurring).length,
    },
    {
      id: "pending",
      label: "Pending",
      description: "Cash-in entries still waiting to clear.",
      count: incomes.filter((income) => income.status === "pending").length,
    },
    {
      id: "invoice-linked",
      label: "Invoice linked",
      description: "Income already tied to invoice-style collection flows.",
      count: incomes.filter((income) => income.source === "invoice").length,
    },
  ];
}

export function buildIncomeTrend(incomes: TransactionRecord[]): IncomeTrendPoint[] {
  const currentWeekStart = getWeekStart(new Date());
  const buckets = Array.from({ length: 6 }, (_, index) => {
    const value = new Date(currentWeekStart);
    value.setDate(value.getDate() - (5 - index) * 7);

    return {
      key: value.toISOString().slice(0, 10),
      label: formatWeekLabel(value),
      income: 0,
    };
  });

  for (const income of incomes) {
    const transactionWeekStart = getWeekStart(new Date(`${income.transactionDate}T00:00:00`));
    const bucket = buckets.find((item) => item.key === transactionWeekStart.toISOString().slice(0, 10));

    if (bucket) {
      bucket.income += income.amount;
    }
  }

  return buckets.map(({ key, ...item }) => {
    void key;

    return item;
  });
}
