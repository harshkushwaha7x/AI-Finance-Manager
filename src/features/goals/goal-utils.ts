import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { GoalRecord, GoalSummary } from "@/types/finance";
import type { GoalPageFilters, GoalSavedView, GoalSavedViewId } from "@/types/goals";

function sortGoals(left: GoalRecord, right: GoalRecord) {
  const statusOrder = {
    active: 0,
    paused: 1,
    completed: 2,
  } satisfies Record<GoalRecord["status"], number>;

  if (statusOrder[left.status] !== statusOrder[right.status]) {
    return statusOrder[left.status] - statusOrder[right.status];
  }

  if (left.daysRemaining !== null && right.daysRemaining !== null && left.daysRemaining !== right.daysRemaining) {
    return left.daysRemaining - right.daysRemaining;
  }

  return right.progressPercent - left.progressPercent;
}

export function formatGoalPriorityLabel(priority: GoalRecord["priority"]) {
  if (priority === "high") {
    return "High priority";
  }

  if (priority === "low") {
    return "Low priority";
  }

  return "Medium priority";
}

export function formatGoalStatusLabel(status: GoalRecord["status"]) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "paused") {
    return "Paused";
  }

  return "Active";
}

export function getGoalStatusVariant(status: GoalRecord["status"]) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "paused") {
    return "secondary" as const;
  }

  return "warning" as const;
}

export function getGoalPriorityVariant(priority: GoalRecord["priority"]) {
  if (priority === "high") {
    return "danger" as const;
  }

  if (priority === "low") {
    return "secondary" as const;
  }

  return "warning" as const;
}

export function buildGoalSummary(goals: GoalRecord[]): GoalSummary {
  return {
    totalTarget: goals.reduce((total, goal) => total + goal.targetAmount, 0),
    totalCurrent: goals.reduce((total, goal) => total + goal.currentAmount, 0),
    activeCount: goals.filter((goal) => goal.status === "active").length,
    completedCount: goals.filter((goal) => goal.status === "completed").length,
    highPriorityCount: goals.filter((goal) => goal.priority === "high").length,
    dueSoonCount: goals.filter(
      (goal) => goal.status === "active" && goal.daysRemaining !== null && goal.daysRemaining <= 30,
    ).length,
  };
}

export function buildGoalSavedViews(goals: GoalRecord[]): GoalSavedView[] {
  return [
    {
      id: "all",
      label: "All goals",
      description: "Every savings or reserve target in the workspace.",
      count: goals.length,
    },
    {
      id: "active",
      label: "Active",
      description: "Goals currently being funded and tracked.",
      count: goals.filter((goal) => goal.status === "active").length,
    },
    {
      id: "high-priority",
      label: "High priority",
      description: "Targets that should not slip this cycle.",
      count: goals.filter((goal) => goal.priority === "high").length,
    },
    {
      id: "due-soon",
      label: "Due soon",
      description: "Active goals with less than a month left.",
      count: goals.filter(
        (goal) => goal.status === "active" && goal.daysRemaining !== null && goal.daysRemaining <= 30,
      ).length,
    },
    {
      id: "completed",
      label: "Completed",
      description: "Targets already achieved and worth showcasing.",
      count: goals.filter((goal) => goal.status === "completed").length,
    },
  ];
}

export function applyGoalSavedView(goals: GoalRecord[], viewId: GoalSavedViewId) {
  if (viewId === "active") {
    return goals.filter((goal) => goal.status === "active");
  }

  if (viewId === "high-priority") {
    return goals.filter((goal) => goal.priority === "high");
  }

  if (viewId === "due-soon") {
    return goals.filter(
      (goal) => goal.status === "active" && goal.daysRemaining !== null && goal.daysRemaining <= 30,
    );
  }

  if (viewId === "completed") {
    return goals.filter((goal) => goal.status === "completed");
  }

  return goals;
}

export function applyGoalPageFilters(goals: GoalRecord[], filters: GoalPageFilters) {
  return goals.filter((goal) => {
    if (filters.priority !== "all" && goal.priority !== filters.priority) {
      return false;
    }

    if (filters.status !== "all" && goal.status !== filters.status) {
      return false;
    }

    return true;
  });
}

export function getGoalMilestoneCopy(goal: GoalRecord) {
  if (goal.status === "completed") {
    return "Completed";
  }

  if (goal.remainingAmount <= 0) {
    return "Ready to close";
  }

  if (goal.progressPercent >= 75) {
    return `Only ${formatTransactionAmount(goal.remainingAmount)} left`;
  }

  if (goal.progressPercent >= 50) {
    return "Crossed the halfway point";
  }

  if (goal.progressPercent >= 25) {
    return "First quarter unlocked";
  }

  return "Getting started";
}

export function sortGoalsForWorkspace(goals: GoalRecord[]) {
  return [...goals].sort(sortGoals);
}
