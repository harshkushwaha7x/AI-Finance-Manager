"use client";

import { CalendarRange, Flag, Milestone, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatGoalPriorityLabel,
  formatGoalStatusLabel,
  getGoalPriorityVariant,
  getGoalStatusVariant,
} from "@/features/goals/goal-utils";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "@/features/transactions/transaction-utils";
import type { GoalRecord } from "@/types/finance";

type GoalFocusPanelProps = {
  goal: GoalRecord | null;
};

export function GoalFocusPanel({ goal }: GoalFocusPanelProps) {
  if (!goal) {
    return (
      <Card className="h-full">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Focus goal</p>
          <CardTitle className="mt-3">Select a goal to inspect progress and urgency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6 text-sm leading-7 text-muted">
            Pick any goal card to review milestone progress, remaining amount, deadline pressure, and the exact contribution gap left to close.
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressWidth = Math.min(100, Math.max(6, goal.progressPercent));

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Focus goal</p>
            <CardTitle className="mt-3">{goal.title}</CardTitle>
            <p className="mt-3 text-sm leading-7 text-muted">{goal.description || "No extra description added yet."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={getGoalStatusVariant(goal.status)}>{formatGoalStatusLabel(goal.status)}</Badge>
            <Badge variant={getGoalPriorityVariant(goal.priority)}>{formatGoalPriorityLabel(goal.priority)}</Badge>
          </div>
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
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted">Saved so far</p>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            {formatTransactionAmount(goal.currentAmount)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Target {formatTransactionAmount(goal.targetAmount)}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Milestone className="h-4 w-4 text-success" />
            <p className="text-sm font-medium text-muted">Milestone</p>
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">{goal.milestoneLabel}</p>
          <p className="mt-2 text-sm text-muted">
            {Math.round(goal.progressPercent)}% complete with {formatTransactionAmount(goal.remainingAmount)} left.
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-4 w-4 text-secondary" />
            <p className="text-sm font-medium text-muted">Deadline</p>
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">
            {goal.targetDate ? formatTransactionDate(goal.targetDate) : "No deadline set"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {goal.daysRemaining === null
              ? "This goal can stay open-ended until you assign a date."
              : goal.daysRemaining >= 0
                ? `${goal.daysRemaining} day${goal.daysRemaining === 1 ? "" : "s"} remaining.`
                : `${Math.abs(goal.daysRemaining)} day${Math.abs(goal.daysRemaining) === 1 ? "" : "s"} past the target date.`}
          </p>
        </div>
        <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
          <div className="flex items-center gap-3">
            <Flag className="h-4 w-4 text-warning" />
            <p className="text-sm font-medium text-muted">Priority</p>
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">{formatGoalPriorityLabel(goal.priority)}</p>
          <p className="mt-2 text-sm text-muted">
            {goal.priority === "high"
              ? "This target should stay protected even if the month gets tighter."
              : goal.priority === "medium"
                ? "A good planning target that can flex around higher-priority needs."
                : "A lower-pressure target that can follow after core reserves are funded."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
