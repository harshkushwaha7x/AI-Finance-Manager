"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardActivityItem } from "@/types/dashboard";

type RecentActivityFeedProps = {
  activities: DashboardActivityItem[];
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Recent activity</p>
        <CardTitle>See what changed in the ledger most recently</CardTitle>
        <p className="text-sm leading-7 text-muted">
          This feed is driven by real transaction activity so you can quickly scan new inflow, spend, and pending follow-up items.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{activity.detail}</p>
                </div>
                <Badge variant={activity.badgeTone}>{activity.badge}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">{activity.amountLabel}</span>
                <span className="text-muted">{activity.dateLabel}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No activity yet</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Add income or expense entries and the dashboard feed will immediately start telling the operating story.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
