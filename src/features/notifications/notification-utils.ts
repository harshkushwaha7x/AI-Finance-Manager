import type { NotificationRecord, NotificationType } from "@/types/finance";

export function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatNotificationTypeLabel(type: NotificationType) {
  if (type === "budget_alert") {
    return "Budget alert";
  }

  if (type === "goal_update") {
    return "Goal update";
  }

  if (type === "report_ready") {
    return "Report ready";
  }

  if (type === "service_status") {
    return "Service status";
  }

  return "System";
}

export function getNotificationTypeVariant(type: NotificationType) {
  if (type === "budget_alert") {
    return "warning" as const;
  }

  if (type === "goal_update") {
    return "secondary" as const;
  }

  if (type === "report_ready") {
    return "success" as const;
  }

  if (type === "service_status") {
    return "primary" as const;
  }

  return "neutral" as const;
}

export function applyNotificationFilters(
  notifications: NotificationRecord[],
  filters: {
    search: string;
    type: "all" | NotificationType;
    readState: "all" | "read" | "unread";
  },
) {
  const query = filters.search.toLowerCase();

  return notifications.filter((notification) => {
    if (filters.type !== "all" && notification.type !== filters.type) {
      return false;
    }

    if (filters.readState === "read" && !notification.readAt) {
      return false;
    }

    if (filters.readState === "unread" && notification.readAt) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [notification.title, notification.body, notification.ctaLabel]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
}
