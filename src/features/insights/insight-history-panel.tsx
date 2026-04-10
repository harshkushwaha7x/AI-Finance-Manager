"use client";

import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatInsightCurrency,
  formatInsightGeneratedAt,
} from "@/features/insights/insight-utils";
import type { InsightHistoryRecord } from "@/types/finance";

type InsightHistoryPanelProps = {
  history: InsightHistoryRecord[];
};

export function InsightHistoryPanel({ history }: InsightHistoryPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Snapshot history</p>
          <CardTitle className="mt-3">Recent insight runs</CardTitle>
          <CardDescription>
            Each refresh saves a structured snapshot so the page can evolve like a real SaaS workflow.
          </CardDescription>
        </div>
        <div className="rounded-2xl bg-primary/8 p-3 text-primary">
          <History className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length ? (
          history.slice(0, 6).map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={index === 0 ? "success" : "secondary"}>
                  {index === 0 ? "Latest" : "Snapshot"}
                </Badge>
                <Badge variant={entry.source === "openai" ? "primary" : "neutral"}>
                  {entry.source === "openai" ? "OpenAI" : "Fallback"}
                </Badge>
              </div>
              <p className="mt-3 font-medium text-foreground">{entry.periodLabel}</p>
              <p className="mt-2 text-sm text-muted">{formatInsightGeneratedAt(entry.generatedAt)}</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {entry.response.summary}
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                Opportunity size: {formatInsightCurrency(entry.totalEstimatedSavings)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-black/8 bg-surface-subtle p-4 text-sm leading-7 text-muted">
            No saved snapshots yet. Refresh insights once to create the first history entry.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
