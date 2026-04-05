"use client";

import { PiggyBank, PlusCircle, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatGoalPriorityLabel,
  formatGoalStatusLabel,
  getGoalPriorityVariant,
  getGoalStatusVariant,
} from "@/features/goals/goal-utils";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import { cn } from "@/lib/utils";
import type { GoalRecord } from "@/types/finance";

type GoalCardGridProps = {
  goals: GoalRecord[];
  activeGoalId?: string | null;
  onSelect: (goal: GoalRecord) => void;
  onContribute: (goal: GoalRecord) => void;
  onEdit: (goal: GoalRecord) => void;
  onDelete: (goal: GoalRecord) => void;
};

export function GoalCardGrid({
  goals,
  activeGoalId,
  onSelect,
  onContribute,
  onEdit,
  onDelete,
}: GoalCardGridProps) {
  if (!goals.length) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
        <p className="font-display text-2xl font-bold text-foreground">No goals match these filters</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Reset the view or create a new target to bring your goal portfolio back into focus.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {goals.map((goal) => {
        const progressWidth = Math.min(100, Math.max(6, goal.progressPercent));

        return (
          <Card
            key={goal.id}
            className={cn(
              "rounded-[1.8rem] border transition",
              activeGoalId === goal.id
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-black/6",
            )}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-surface-subtle p-2 text-primary">
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted">{goal.icon || "savings goal"}</p>
                      <CardTitle className="mt-1">{goal.title}</CardTitle>
                    </div>
                  </div>
                </div>
                <Badge variant={getGoalStatusVariant(goal.status)}>{formatGoalStatusLabel(goal.status)}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getGoalPriorityVariant(goal.priority)}>{formatGoalPriorityLabel(goal.priority)}</Badge>
                {goal.targetDate ? <Badge variant="secondary">Deadline set</Badge> : null}
                <Badge variant="secondary">{goal.milestoneLabel}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-muted">
                {goal.description || "Use this goal to turn a vague savings intention into a visible, trackable target."}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted">Progress</span>
                  <span className="font-semibold text-foreground">{Math.round(goal.progressPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black/6">
                  <div
                    className={`h-full rounded-full ${
                      goal.status === "completed"
                        ? "bg-success"
                        : goal.priority === "high"
                          ? "bg-warning"
                          : "bg-primary"
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Saved</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(goal.currentAmount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Target</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(goal.targetAmount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-black/6 bg-surface-subtle p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Left</p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatTransactionAmount(goal.remainingAmount)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <p>
                  {goal.daysRemaining === null
                    ? "No deadline yet."
                    : goal.daysRemaining >= 0
                      ? `${goal.daysRemaining} day${goal.daysRemaining === 1 ? "" : "s"} remaining.`
                      : `${Math.abs(goal.daysRemaining)} day${Math.abs(goal.daysRemaining) === 1 ? "" : "s"} overdue.`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(goal)}>
                    Focus
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onContribute(goal)}>
                    <PlusCircle className="h-4 w-4" />
                    Contribute
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(goal)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
