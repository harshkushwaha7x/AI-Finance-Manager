"use client";

import { PiggyBank } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatInsightCurrency,
  getInsightPriorityVariant,
} from "@/features/insights/insight-utils";
import type { InsightHistoryRecord } from "@/types/finance";

type SavingSuggestionsCardProps = {
  current: InsightHistoryRecord;
};

export function SavingSuggestionsCard({ current }: SavingSuggestionsCardProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Savings ideas</p>
          <CardTitle className="mt-3">Targeted optimization suggestions</CardTitle>
          <CardDescription>
            These recommendations estimate concrete INR impact instead of staying generic.
          </CardDescription>
        </div>
        <div className="rounded-2xl bg-primary/8 p-3 text-primary">
          <PiggyBank className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {current.response.suggestions.length ? (
          current.response.suggestions.map((suggestion) => (
            <div
              key={`${suggestion.title}-${suggestion.priority}`}
              className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getInsightPriorityVariant(suggestion.priority)}>
                      {suggestion.priority} priority
                    </Badge>
                    <Badge variant="success">
                      {formatInsightCurrency(suggestion.estimatedSavings)}
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground">{suggestion.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">{suggestion.rationale}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-5 text-sm leading-7 text-muted">
            No savings opportunities are standing out yet. Refresh insights after more spending activity lands.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
