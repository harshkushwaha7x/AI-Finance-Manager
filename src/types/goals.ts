import type { GoalRecord, GoalSummary, GoalWorkspaceState } from "@/types/finance";

export type GoalSavedViewId =
  | "all"
  | "active"
  | "high-priority"
  | "due-soon"
  | "completed";

export type GoalSavedView = {
  id: GoalSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type GoalPageFilters = {
  priority: string;
  status: string;
};

export type GoalWorkspaceViewState = {
  goals: GoalRecord[];
  summary: GoalSummary;
  source: GoalWorkspaceState["source"];
};
