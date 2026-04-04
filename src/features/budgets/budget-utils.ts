import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type {
  BudgetAlert,
  BudgetRecord,
  BudgetSummary,
} from "@/types/finance";
import type {
  BudgetPageFilters,
  BudgetSavedView,
  BudgetSavedViewId,
} from "@/types/budgets";

function sortBudgetsByStatusAndUtilization(left: BudgetRecord, right: BudgetRecord) {
  const statusOrder = {
    over: 0,
    watch: 1,
    healthy: 2,
  } satisfies Record<BudgetRecord["status"], number>;

  if (statusOrder[left.status] !== statusOrder[right.status]) {
    return statusOrder[left.status] - statusOrder[right.status];
  }

  return right.utilizationPercent - left.utilizationPercent;
}

export function formatBudgetPeriodLabel(period: BudgetRecord["period"]) {
  if (period === "quarterly") {
    return "Quarterly";
  }

  if (period === "yearly") {
    return "Yearly";
  }

  return "Monthly";
}

export function formatBudgetStatusLabel(status: BudgetRecord["status"]) {
  if (status === "over") {
    return "Over budget";
  }

  if (status === "watch") {
    return "Watch";
  }

  return "Healthy";
}

export function getBudgetStatusVariant(status: BudgetRecord["status"]) {
  if (status === "over") {
    return "danger" as const;
  }

  if (status === "watch") {
    return "warning" as const;
  }

  return "success" as const;
}

export function buildBudgetSummary(budgets: BudgetRecord[]): BudgetSummary {
  const totalBudgeted = budgets.reduce((total, budget) => total + budget.limitAmount, 0);
  const totalSpent = budgets.reduce((total, budget) => total + budget.spentAmount, 0);
  const totalRemaining = budgets.reduce((total, budget) => total + budget.remainingAmount, 0);

  return {
    totalBudgeted,
    totalSpent,
    totalRemaining,
    activeCount: budgets.length,
    healthyCount: budgets.filter((budget) => budget.status === "healthy").length,
    watchCount: budgets.filter((budget) => budget.status === "watch").length,
    overCount: budgets.filter((budget) => budget.status === "over").length,
  };
}

export function buildBudgetAlerts(budgets: BudgetRecord[]): BudgetAlert[] {
  return budgets
    .filter((budget) => budget.status !== "healthy")
    .sort(sortBudgetsByStatusAndUtilization)
    .slice(0, 4)
    .map((budget) => {
      const amountLabel =
        budget.remainingAmount >= 0
          ? `${formatTransactionAmount(budget.remainingAmount)} left`
          : `${formatTransactionAmount(Math.abs(budget.remainingAmount))} over`;

      return {
        id: budget.id,
        budgetId: budget.id,
        title:
          budget.status === "over"
            ? `${budget.categoryLabel} is past the planned limit`
            : `${budget.categoryLabel} is nearing its alert threshold`,
        description: `${Math.round(budget.utilizationPercent)}% used with ${amountLabel} in the current ${formatBudgetPeriodLabel(
          budget.period,
        ).toLowerCase()} window.`,
        status: budget.status,
        tone: budget.status === "over" ? "danger" : "warning",
      };
    });
}

export function buildBudgetSavedViews(budgets: BudgetRecord[]): BudgetSavedView[] {
  return [
    {
      id: "all",
      label: "All budgets",
      description: "Every active planning rule in the workspace.",
      count: budgets.length,
    },
    {
      id: "healthy",
      label: "Healthy",
      description: "Budgets that still have comfortable room left.",
      count: budgets.filter((budget) => budget.status === "healthy").length,
    },
    {
      id: "watch",
      label: "Watchlist",
      description: "Budgets that crossed the alert threshold.",
      count: budgets.filter((budget) => budget.status === "watch").length,
    },
    {
      id: "over",
      label: "Over budget",
      description: "The categories already beyond their planned limit.",
      count: budgets.filter((budget) => budget.status === "over").length,
    },
    {
      id: "quarterly",
      label: "Quarterly",
      description: "Longer-horizon budgets that smooth month-to-month swings.",
      count: budgets.filter((budget) => budget.period === "quarterly").length,
    },
  ];
}

export function applyBudgetSavedView(budgets: BudgetRecord[], viewId: BudgetSavedViewId) {
  if (viewId === "healthy") {
    return budgets.filter((budget) => budget.status === "healthy");
  }

  if (viewId === "watch") {
    return budgets.filter((budget) => budget.status === "watch");
  }

  if (viewId === "over") {
    return budgets.filter((budget) => budget.status === "over");
  }

  if (viewId === "quarterly") {
    return budgets.filter((budget) => budget.period === "quarterly");
  }

  return budgets;
}

export function applyBudgetPageFilters(budgets: BudgetRecord[], filters: BudgetPageFilters) {
  return budgets.filter((budget) => {
    if (filters.category !== "all" && budget.categoryLabel !== filters.category) {
      return false;
    }

    if (filters.period !== "all" && budget.period !== filters.period) {
      return false;
    }

    if (filters.status !== "all" && budget.status !== filters.status) {
      return false;
    }

    return true;
  });
}
