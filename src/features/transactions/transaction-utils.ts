import type {
  TransactionFilters,
  TransactionRecord,
  TransactionSummary,
} from "@/types/finance";

function toLower(value: string | undefined) {
  return value?.toLowerCase() ?? "";
}

export function formatTransactionAmount(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatTransactionTypeLabel(type: TransactionRecord["type"]) {
  if (type === "income") {
    return "Income";
  }

  if (type === "expense") {
    return "Expense";
  }

  return "Transfer";
}

export function formatTransactionStatusLabel(status: TransactionRecord["status"]) {
  return status === "cleared" ? "Cleared" : "Pending";
}

export function getTransactionTypeVariant(type: TransactionRecord["type"]) {
  if (type === "income") {
    return "success" as const;
  }

  if (type === "expense") {
    return "secondary" as const;
  }

  return "neutral" as const;
}

export function getTransactionStatusVariant(status: TransactionRecord["status"]) {
  return status === "cleared" ? ("success" as const) : ("warning" as const);
}

export function buildTransactionSearchIndex(transaction: TransactionRecord) {
  return [
    transaction.title,
    transaction.categoryLabel,
    transaction.merchantName,
    transaction.description,
    transaction.notes,
  ]
    .filter(Boolean)
    .join(" ");
}

export function applyTransactionFilters(
  transactions: TransactionRecord[],
  filters: TransactionFilters,
) {
  const searchQuery = toLower(filters.search);

  return transactions.filter((transaction) => {
    if (filters.status !== "all" && transaction.status !== filters.status) {
      return false;
    }

    if (filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (filters.category !== "all" && transaction.categoryLabel !== filters.category) {
      return false;
    }

    if (filters.dateFrom && transaction.transactionDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && transaction.transactionDate > filters.dateTo) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    return toLower(buildTransactionSearchIndex(transaction)).includes(searchQuery);
  });
}

export function summarizeTransactions(transactions: TransactionRecord[]): TransactionSummary {
  const incomeTotal = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenseTotal = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const reviewCount = transactions.filter((transaction) => transaction.status === "pending").length;
  const recurringCount = transactions.filter((transaction) => transaction.recurring).length;

  return {
    incomeTotal,
    expenseTotal,
    reviewCount,
    recurringCount,
    netCashflow: incomeTotal - expenseTotal,
  };
}
