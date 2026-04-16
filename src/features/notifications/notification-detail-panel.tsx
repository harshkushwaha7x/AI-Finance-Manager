import Link from "next/link";

import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { NotificationRecord } from "@/types/finance";

import {
  formatNotificationDate,
  formatNotificationTypeLabel,
  getNotificationTypeVariant,
} from "./notification-utils";

type NotificationDetailPanelProps = {
  notification: NotificationRecord | null;
  onToggleRead: (notification: NotificationRecord) => void;
};

export function NotificationDetailPanel({
  notification,
  onToggleRead,
}: NotificationDetailPanelProps) {
  return (
    <Card>
      <CardHeader className="space-y-6">
        <SectionToolbar
          title="Notification detail"
          description="Inspect the full alert context and jump into the related workflow from here."
        />
      </CardHeader>
      <CardContent>
        {notification ? (
          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-black/6 bg-foreground p-6 text-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl font-bold tracking-tight">
                    {notification.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    Created {formatNotificationDate(notification.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getNotificationTypeVariant(notification.type)} className="bg-white/10 text-white">
                    {formatNotificationTypeLabel(notification.type)}
                  </Badge>
                  <Badge variant={notification.readAt ? "neutral" : "warning"} className={notification.readAt ? "" : "bg-white/10 text-white"}>
                    {notification.readAt ? "read" : "unread"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
              <p className="text-sm leading-8 text-foreground">{notification.body}</p>
              {notification.readAt ? (
                <p className="mt-4 text-sm text-muted">Last acknowledged {formatNotificationDate(notification.readAt)}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onToggleRead(notification)}>
                Mark as {notification.readAt ? "unread" : "read"}
              </Button>
              {notification.ctaUrl ? (
                <Button variant="secondary" asChild>
                  <Link href={notification.ctaUrl}>{notification.ctaLabel || "Open workflow"}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">Pick a notification</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Select an item from the inbox to review the full alert and jump into the related workflow.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
