import type {
  AccountantRequestRecord,
} from "@/types/finance";
import type { SupportUserRecord } from "@/types/admin";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getRequestStatusBadgeVariant(
  status: AccountantRequestRecord["status"],
): BadgeVariant {
  if (status === "completed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  if (status === "scheduled") {
    return "secondary";
  }

  if (status === "in_progress") {
    return "primary";
  }

  if (status === "qualified") {
    return "warning";
  }

  return "neutral";
}

export function getUrgencyBadgeVariant(
  urgency: AccountantRequestRecord["urgency"],
): BadgeVariant {
  if (urgency === "high") {
    return "danger";
  }

  if (urgency === "low") {
    return "secondary";
  }

  return "warning";
}

export function formatRequestTypeLabel(type: AccountantRequestRecord["requestType"]) {
  return type === "gst"
    ? "GST"
    : type === "bookkeeping"
      ? "Bookkeeping"
      : type === "filing"
        ? "Filing"
        : type === "custom"
          ? "Custom"
          : "Consultation";
}

export function getProfileTypeBadgeVariant(
  profileType: SupportUserRecord["profileType"],
): BadgeVariant {
  if (profileType === "business") {
    return "secondary";
  }

  if (profileType === "personal") {
    return "neutral";
  }

  return "primary";
}

export function formatProfileTypeLabel(profileType: SupportUserRecord["profileType"]) {
  return profileType.charAt(0).toUpperCase() + profileType.slice(1);
}
