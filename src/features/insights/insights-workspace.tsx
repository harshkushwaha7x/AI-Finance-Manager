"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightHistoryPanel } from "@/features/insights/insight-history-panel";
import { InsightListCard } from "@/features/insights/insight-list-card";
import { InsightSummaryStrip } from "@/features/insights/insight-summary-strip";
import { SavingSuggestionsCard } from "@/features/insights/saving-suggestions-card";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type { InsightWorkspaceState } from "@/types/finance";

type InsightsWorkspaceProps = {
  initialState: InsightWorkspaceState;
};

type InsightRefreshResponse = InsightWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function InsightsWorkspace({ initialState }: InsightsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const payload = (await response.json()) as InsightRefreshResponse;

      if (!response.ok || !payload.current || !payload.history || !payload.source) {
        throw new Error(payload.message ?? "Unable to refresh insights right now.");
      }

      setWorkspaceState({
        current: payload.current,
        history: payload.history,
        source: payload.source,
      });
      emitNotificationsChanged();
      toast.success("Insights refreshed and snapshot history updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh insights.";
      toast.error(message);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI insights"
        title="Translate finance activity into concrete decisions"
        description="This workspace now turns live transaction, budget, and goal data into AI-ready analysis, savings suggestions, and snapshot history you can revisit later."
        badge={workspaceState.current.source === "openai" ? "OpenAI live" : "Fallback live"}
        actions={
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh insights"}
          </Button>
        }
      />

      <Card className="rounded-[1.7rem] border-warning/20 bg-warning/5">
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <div className="rounded-2xl bg-warning/15 p-3 text-warning">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Advisory only</CardTitle>
            <CardDescription className="mt-2">
              These insights are designed to help you prioritize follow-up, not replace legal, tax, or professional accounting advice.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <InsightSummaryStrip current={workspaceState.current} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-[1.7rem]">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Current analysis</p>
            <CardTitle className="mt-3">Executive summary</CardTitle>
            <CardDescription>
              Generated for {workspaceState.current.periodLabel} and saved as a structured snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
              <p className="text-sm leading-8 text-foreground">
                {workspaceState.current.response.summary}
              </p>
            </div>
          </CardContent>
        </Card>
        <InsightHistoryPanel history={workspaceState.history} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <InsightListCard
          eyebrow="Signals"
          title="Anomalies and risks"
          description="The places where spending patterns or workflow quality need attention first."
          items={[
            ...workspaceState.current.response.anomalies,
            ...workspaceState.current.response.risks,
          ]}
          emptyMessage="No major anomalies or active risks are standing out in the current dataset."
        />
        <InsightListCard
          eyebrow="Next moves"
          title="Opportunities and actions"
          description="The highest-leverage actions to improve reporting quality and financial control."
          items={[
            ...workspaceState.current.response.opportunities,
            ...workspaceState.current.response.actions,
          ]}
          emptyMessage="No specific actions were generated yet. Refresh after more finance activity lands."
        />
      </div>

      <SavingSuggestionsCard current={workspaceState.current} />
    </div>
  );
}
