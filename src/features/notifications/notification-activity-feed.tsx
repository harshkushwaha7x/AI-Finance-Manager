import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NotificationActivityItem } from "@/types/finance";

type NotificationActivityFeedProps = {
  activity: NotificationActivityItem[];
};

export function NotificationActivityFeed({ activity }: NotificationActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Activity feed</p>
        <CardTitle>Recent ledger, AI, and service movement</CardTitle>
        <p className="text-sm leading-7 text-muted">
          This gives the inbox extra context by mixing transaction activity with the latest AI and report events.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.length ? (
          activity.map((item) => (
            <div key={item.id} className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p>
                </div>
                <Badge variant={item.badgeTone}>{item.badge}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted">{item.dateLabel}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No recent activity</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Create ledger, AI, or booking activity and this feed will start to mirror it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
