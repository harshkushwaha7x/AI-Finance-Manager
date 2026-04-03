import type {
  ExpenseCategoryBreakdownItem,
  ExpensePageFilters,
  ExpenseSavedView,
  ExpenseSavedViewId,
  ExpenseSummary,
} from "@/types/expenses";
import type { TransactionCategoryOption, TransactionRecord } from "@/types/finance";

const FALLBACK_BREAKDOWN_COLOR = "#94a3b8";

function sortByDateDesc(left: TransactionRecord, right: TransactionRecord) {
  return right.transactionDate.localeCompare(left.transactionDate);
}

export function getExpenseCategories(categories: TransactionCategoryOption[]) {
  return categories.filter((category) => category.kind === "expense");
}

export function getExpenseTransactions(transactions: TransactionRecord[]) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .sort(sortByDateDesc);
}

export function buildExpenseBreakdown(
  expenses: TransactionRecord[],
  categories: TransactionCategoryOption[],
): ExpenseCategoryBreakdownItem[] {
  const totalSpend = expenses.reduce((total, expense) => total + expense.amount, 0);
  const breakdownMap = new Map<string, ExpenseCategoryBreakdownItem>();

  for (const expense of expenses) {
    const category =
      categories.find((item) => item.id === expense.categoryId) ??
      categories.find((item) => item.label === expense.categoryLabel);
    const key = category?.id ?? expense.categoryLabel;
    const existing = breakdownMap.get(key);

    if (existing) {
      existing.amount += expense.amount;
      existing.count += 1;
      continue;
    }

    breakdownMap.set(key, {
      categoryId: category?.id,
      label: expense.categoryLabel,
      amount: expense.amount,
      share: 0,
      color: category?.color ?? FALLBACK_BREAKDOWN_COLOR,
      count: 1,
    });
  }

  return Array.from(breakdownMap.values())
    .sort((left, right) => right.amount - left.amount)
    .map((item) => ({
      ...item,
      share:
        totalSpend > 0 ? Math.max(1, Math.round((item.amount / totalSpend) * 100)) : 0,
    }));
}

export function buildExpenseSummary(
  expenses: TransactionRecord[],
  breakdown: ExpenseCategoryBreakdownItem[],
): ExpenseSummary {
  const totalSpend = expenses.reduce((total, expense) => total + expense.amount, 0);
  const recurringExpenses = expenses.filter((expense) => expense.recurring);
  const topCategory = breakdown[0];

  return {
    totalSpend,
    averageExpense: expenses.length ? totalSpend / expenses.length : 0,
    recurringCommitments: recurringExpenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    ),
    recurringCount: recurringExpenses.length,
    reviewCount: expenses.filter((expense) => expense.status === "pending").length,
    topCategoryLabel: topCategory?.label ?? "No category data yet",
    topCategoryAmount: topCategory?.amount ?? 0,
  };
}

export function getRecurringExpenses(expenses: TransactionRecord[]) {
  return expenses
    .filter((expense) => expense.recurring)
    .sort((left, right) => right.amount - left.amount);
}

export function applyExpenseSavedView(
  expenses: TransactionRecord[],
  viewId: ExpenseSavedViewId,
) {
  if (viewId === "recurring") {
    return expenses.filter((expense) => expense.recurring);
  }

  if (viewId === "needs-review") {
    return expenses.filter((expense) => expense.status === "pending");
  }

  if (viewId === "software-tax") {
    return expenses.filter((expense) =>
      ["Software", "Tax"].includes(expense.categoryLabel),
    );
  }

  return expenses;
}

export function applyExpensePageFilters(
  expenses: TransactionRecord[],
  filters: ExpensePageFilters,
) {
  return expenses.filter((expense) => {
    if (filters.category !== "all" && expense.categoryLabel !== filters.category) {
      return false;
    }

    if (filters.dateFrom && expense.transactionDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && expense.transactionDate > filters.dateTo) {
      return false;
    }

    return true;
  });
}

export function buildExpenseSavedViews(expenses: TransactionRecord[]): ExpenseSavedView[] {
  return [
    {
      id: "all",
      label: "All expenses",
      description: "Every outgoing transaction in the ledger.",
      count: expenses.length,
    },
    {
      id: "recurring",
      label: "Recurring",
      description: "Subscriptions, rent, and repeated operational spend.",
      count: expenses.filter((expense) => expense.recurring).length,
    },
    {
      id: "needs-review",
      label: "Needs review",
      description: "Pending records that still need bookkeeping attention.",
      count: expenses.filter((expense) => expense.status === "pending").length,
    },
    {
      id: "software-tax",
      label: "Software + tax",
      description: "The two categories that often drive monthly pressure.",
      count: expenses.filter((expense) =>
        ["Software", "Tax"].includes(expense.categoryLabel),
      ).length,
    },
  ];
}
