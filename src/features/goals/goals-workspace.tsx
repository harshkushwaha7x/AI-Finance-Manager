"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GoalCardGrid } from "@/features/goals/goal-card-grid";
import { GoalContributionDrawer } from "@/features/goals/goal-contribution-drawer";
import { GoalFiltersPanel } from "@/features/goals/goal-filters-panel";
import { GoalFocusPanel } from "@/features/goals/goal-focus-panel";
import { GoalFormDrawer } from "@/features/goals/goal-form-drawer";
import { GoalSavedViews } from "@/features/goals/goal-saved-views";
import { GoalSummaryStrip } from "@/features/goals/goal-summary-strip";
import {
  applyGoalPageFilters,
  applyGoalSavedView,
  buildGoalSavedViews,
  buildGoalSummary,
  sortGoalsForWorkspace,
} from "@/features/goals/goal-utils";
import type {
  GoalContributionInput,
  GoalInput,
  GoalRecord,
  GoalWorkspaceState,
} from "@/types/finance";
import type { GoalPageFilters, GoalSavedViewId } from "@/types/goals";

type GoalsWorkspaceProps = {
  initialState: GoalWorkspaceState;
};

type MutationPayload = {
  ok?: boolean;
  message?: string;
  goal?: GoalRecord;
  goals?: GoalRecord[];
  deletedId?: string;
};

const defaultGoalPageFilters: GoalPageFilters = {
  priority: "all",
  status: "all",
};

export function GoalsWorkspace({ initialState }: GoalsWorkspaceProps) {
  const [goals, setGoals] = useState(initialState.goals);
  const [pageFilters, setPageFilters] = useState<GoalPageFilters>(defaultGoalPageFilters);
  const [activeView, setActiveView] = useState<GoalSavedViewId>("all");
  const [activeGoal, setActiveGoal] = useState<GoalRecord | null>(initialState.goals[0] ?? null);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalRecord | null>(null);
  const [contributionGoal, setContributionGoal] = useState<GoalRecord | null>(null);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);

  const summary = useMemo(() => buildGoalSummary(goals), [goals]);
  const savedViews = useMemo(() => buildGoalSavedViews(goals), [goals]);
  const visibleGoals = useMemo(
    () => applyGoalPageFilters(applyGoalSavedView(goals, activeView), pageFilters),
    [activeView, goals, pageFilters],
  );

  async function createGoalRecord(values: GoalInput) {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.goal || !payload.goals) {
      throw new Error(payload.message ?? "Unable to create the goal.");
    }

    const nextGoals = sortGoalsForWorkspace(payload.goals);
    setGoals(nextGoals);
    setActiveGoal(payload.goal);
    setIsFormDrawerOpen(false);
    setEditingGoal(null);
    toast.success("Goal created.");
  }

  async function updateGoalRecord(values: GoalInput) {
    if (!editingGoal) {
      return;
    }

    const response = await fetch(`/api/goals/${editingGoal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.goal || !payload.goals) {
      throw new Error(payload.message ?? "Unable to update the goal.");
    }

    const nextGoals = sortGoalsForWorkspace(payload.goals);
    setGoals(nextGoals);
    setActiveGoal(payload.goal);
    setEditingGoal(null);
    setIsFormDrawerOpen(false);
    toast.success("Goal updated.");
  }

  async function addContribution(values: GoalContributionInput) {
    if (!contributionGoal) {
      return;
    }

    const response = await fetch(`/api/goals/${contributionGoal.id}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.goal || !payload.goals) {
      throw new Error(payload.message ?? "Unable to record the contribution.");
    }

    const nextGoals = sortGoalsForWorkspace(payload.goals);
    setGoals(nextGoals);
    setActiveGoal(payload.goal);
    setContributionGoal(null);
    toast.success("Contribution recorded.");
  }

  async function deleteGoalRecord() {
    if (!goalToDelete) {
      return;
    }

    const response = await fetch(`/api/goals/${goalToDelete.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.deletedId || !payload.goals) {
      throw new Error(payload.message ?? "Unable to delete the goal.");
    }

    const nextGoals = sortGoalsForWorkspace(payload.goals);
    setGoals(nextGoals);
    setActiveGoal((current) => {
      if (!current || current.id !== payload.deletedId) {
        return current;
      }

      return nextGoals[0] ?? null;
    });
    setEditingGoal((current) => (current?.id === payload.deletedId ? null : current));
    setGoalToDelete(null);
    toast.success("Goal deleted.");
  }

  async function handleGoalSubmit(values: GoalInput) {
    try {
      if (editingGoal) {
        await updateGoalRecord(values);
      } else {
        await createGoalRecord(values);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleContributionSubmit(values: GoalContributionInput) {
    try {
      await addContribution(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteGoalRecord();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Goals"
        title="Turn savings intent into visible progress"
        description="The goals module now tracks real target progress, contribution updates, deadline pressure, and completed milestones instead of placeholder planning copy."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setEditingGoal(null);
              setIsFormDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        }
      />
      <GoalSummaryStrip summary={summary} />
      <GoalSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GoalFocusPanel goal={activeGoal} />
        <GoalFiltersPanel
          filters={pageFilters}
          onFiltersChange={setPageFilters}
          onReset={() => setPageFilters(defaultGoalPageFilters)}
        />
      </section>
      <GoalCardGrid
        goals={visibleGoals}
        activeGoalId={activeGoal?.id}
        onSelect={setActiveGoal}
        onContribute={(goal) => {
          setContributionGoal(goal);
          setActiveGoal(goal);
        }}
        onEdit={(goal) => {
          setEditingGoal(goal);
          setActiveGoal(goal);
          setIsFormDrawerOpen(true);
        }}
        onDelete={(goal) => setGoalToDelete(goal)}
      />
      <GoalFormDrawer
        open={isFormDrawerOpen}
        mode={editingGoal ? "edit" : "create"}
        initialGoal={editingGoal}
        onOpenChange={(open) => {
          setIsFormDrawerOpen(open);
          if (!open) {
            setEditingGoal(null);
          }
        }}
        onSubmit={handleGoalSubmit}
      />
      <GoalContributionDrawer
        open={Boolean(contributionGoal)}
        goal={contributionGoal}
        onOpenChange={(open) => {
          if (!open) {
            setContributionGoal(null);
          }
        }}
        onSubmit={handleContributionSubmit}
      />
      <ConfirmDialog
        open={Boolean(goalToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setGoalToDelete(null);
          }
        }}
        title="Delete this goal?"
        description="This removes the target from the current workspace and updates dashboard goal highlights immediately."
        confirmLabel="Delete goal"
        tone="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
