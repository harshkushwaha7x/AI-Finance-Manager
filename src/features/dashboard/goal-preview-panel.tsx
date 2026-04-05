"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTransactionAmount } from "@/features/transactions/transaction-utils";
import type { DashboardGoalPreview } from "@/types/dashboard";

type GoalPreviewPanelProps = {
  goals: DashboardGoalPreview[];
};

export function GoalPreviewPanel({ goals }: GoalPreviewPanelProps) {
  const isLiveGoals = goals.some((goal) => goal.source === "goal");

  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
          {isLiveGoals ? "Goals" : "Goal previews"}
        </p>
        <CardTitle>
          {isLiveGoals
            ? "Track live savings and reserve goals from the dedicated workspace"
            : "Model savings and runway before the full goals module lands"}
        </CardTitle>
        <p className="text-sm leading-7 text-muted">
          {isLiveGoals
            ? "These progress cards now come directly from the real goals module, so contributions and completions show up here as soon as they are recorded."
            : "These progress cards are derived from your onboarding targets plus the live ledger so the dashboard already tells a more grounded planning story."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const progress = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;

          return (
            <div key={goal.title} className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{goal.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{goal.description}</p>
                </div>
                <Badge variant={goal.tone}>{progress}%</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <span>{formatTransactionAmount(goal.current)} {goal.unitLabel}</span>
                <span>Target {formatTransactionAmount(goal.target)}</span>
              </div>
              {goal.statusLabel || goal.targetDateLabel ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {goal.statusLabel ? <Badge variant={goal.tone}>{goal.statusLabel}</Badge> : null}
                  {goal.targetDateLabel ? <Badge variant="secondary">{goal.targetDateLabel}</Badge> : null}
                </div>
              ) : null}
              <div className="mt-3 h-2.5 rounded-full bg-background">
                <div
                  className="h-2.5 rounded-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
