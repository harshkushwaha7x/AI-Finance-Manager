import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Select } from "@/components/ui/select";
import type { NotificationRecord, NotificationType } from "@/types/finance";

import {
  formatNotificationDate,
  formatNotificationTypeLabel,
  getNotificationTypeVariant,
} from "./notification-utils";

type NotificationInboxPanelProps = {
  notifications: NotificationRecord[];
  activeNotificationId: string | null;
  filters: {
    search: string;
    type: "all" | NotificationType;
    readState: "all" | "read" | "unread";
  };
  onFiltersChange: (filters: {
    search: string;
    type: "all" | NotificationType;
    readState: "all" | "read" | "unread";
  }) => void;
  onSelect: (notificationId: string) => void;
  onMarkAllRead: () => void;
};

export function NotificationInboxPanel({
  notifications,
  activeNotificationId,
  filters,
  onFiltersChange,
  onSelect,
  onMarkAllRead,
}: NotificationInboxPanelProps) {
  return (
    <Card>
      <CardHeader className="space-y-6">
        <SectionToolbar
          title="Inbox"
          description="Filter the live alert stream and review notifications one by one."
          actions={
            <Button variant="secondary" size="sm" onClick={onMarkAllRead} disabled={!notifications.length}>
              Mark all read
            </Button>
          }
        />
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Search notifications"
          />
          <Select
            value={filters.type}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                type: event.target.value as "all" | NotificationType,
              })
            }
          >
            <option value="all">All types</option>
            <option value="budget_alert">Budget alerts</option>
            <option value="goal_update">Goal updates</option>
            <option value="report_ready">Reports</option>
            <option value="service_status">Service status</option>
            <option value="system">System</option>
          </Select>
          <Select
            value={filters.readState}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                readState: event.target.value as "all" | "read" | "unread",
              })
            }
          >
            <option value="all">All states</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.length ? (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => onSelect(notification.id)}
              className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                notification.id === activeNotificationId
                  ? "border-primary/30 bg-primary/6"
                  : "border-black/6 bg-surface-subtle hover:border-primary/20"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                    {!notification.readAt ? (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-muted">{notification.body}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getNotificationTypeVariant(notification.type)}>
                    {formatNotificationTypeLabel(notification.type)}
                  </Badge>
                  <Badge variant={notification.readAt ? "neutral" : "warning"}>
                    {notification.readAt ? "read" : "unread"}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted">
                {formatNotificationDate(notification.createdAt)}
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="font-display text-2xl font-bold text-foreground">No notifications match</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Adjust the filters or generate more finance activity to repopulate the inbox.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
