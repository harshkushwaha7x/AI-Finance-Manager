"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { NotificationActivityFeed } from "@/features/notifications/notification-activity-feed";
import { NotificationDetailPanel } from "@/features/notifications/notification-detail-panel";
import { NotificationInboxPanel } from "@/features/notifications/notification-inbox-panel";
import { NotificationSummaryStrip } from "@/features/notifications/notification-summary-strip";
import { applyNotificationFilters } from "@/features/notifications/notification-utils";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type {
  NotificationReadInput,
  NotificationRecord,
  NotificationWorkspaceState,
} from "@/types/finance";

type NotificationsWorkspaceProps = {
  initialState: NotificationWorkspaceState;
};

type NotificationFilters = {
  search: string;
  type: "all" | NotificationRecord["type"];
  readState: "all" | "read" | "unread";
};

type NotificationMutationPayload = NotificationWorkspaceState & {
  ok?: boolean;
  message?: string;
};

const defaultFilters: NotificationFilters = {
  search: "",
  type: "all",
  readState: "all",
};

export function NotificationsWorkspace({ initialState }: NotificationsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [filters, setFilters] = useState<NotificationFilters>(defaultFilters);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(
    initialState.notifications[0]?.id ?? null,
  );
  const [isMutating, setIsMutating] = useState(false);

  const filteredNotifications = useMemo(
    () => applyNotificationFilters(workspaceState.notifications, filters),
    [filters, workspaceState.notifications],
  );
  const activeNotification = useMemo(
    () =>
      workspaceState.notifications.find((notification) => notification.id === selectedNotificationId) ??
      filteredNotifications[0] ??
      workspaceState.notifications[0] ??
      null,
    [filteredNotifications, selectedNotificationId, workspaceState.notifications],
  );

  async function updateReadState(payload: NotificationReadInput) {
    setIsMutating(true);

    try {
      const response = await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as NotificationMutationPayload;

      if (!response.ok || !result.notifications || !result.summary || !result.activity) {
        throw new Error(result.message ?? "Unable to update notifications.");
      }

      setWorkspaceState({
        notifications: result.notifications,
        summary: result.summary,
        activity: result.activity,
        source: result.source,
      });
      emitNotificationsChanged();
      toast.success(payload.markAll ? "All notifications updated." : "Notification updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsMutating(false);
    }
  }

  function handleToggleRead(notification: NotificationRecord) {
    void updateReadState({
      ids: [notification.id],
      markAll: false,
      read: !notification.readAt,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notifications"
        title="Keep finance, AI, and service alerts in one review loop"
        description="The notification center now aggregates planning pressure, report outputs, bookings, and system review prompts into a single in-app inbox."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <NotificationSummaryStrip summary={workspaceState.summary} />

      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <NotificationInboxPanel
          notifications={filteredNotifications}
          activeNotificationId={activeNotification?.id ?? null}
          filters={filters}
          onFiltersChange={setFilters}
          onSelect={setSelectedNotificationId}
          onMarkAllRead={() => {
            if (isMutating || !workspaceState.summary.unreadCount) {
              return;
            }

            void updateReadState({
              ids: [],
              markAll: true,
              read: true,
            });
          }}
        />
        <NotificationDetailPanel notification={activeNotification} onToggleRead={handleToggleRead} />
      </div>

      <NotificationActivityFeed activity={workspaceState.activity} />
    </div>
  );
}
