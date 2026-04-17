import type {
  NotificationPreferences,
  SettingsBillingStatus,
  SettingsSubscriptionPlan,
} from "@/types/settings";

export function formatSettingsPlan(plan: SettingsSubscriptionPlan) {
  if (plan === "business") {
    return "Business";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

export function formatSettingsBillingStatus(status: SettingsBillingStatus) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getPlanFeatureList(plan: SettingsSubscriptionPlan) {
  if (plan === "business") {
    return [
      "Priority accountant workflows",
      "Business reporting and service handoff",
      "Extended document and GST readiness tooling",
    ];
  }

  if (plan === "pro") {
    return [
      "Advanced AI insights and report exports",
      "Invoice-first freelancer workflows",
      "Deeper planning and automation modules",
    ];
  }

  return [
    "Core finance tracking and budgeting",
    "Foundational AI and service previews",
    "Manual billing state for portfolio demos",
  ];
}

export function getNotificationPreferenceLabel(
  key: keyof NotificationPreferences,
) {
  if (key === "budgetAlerts") {
    return "Budget alerts";
  }

  if (key === "goalUpdates") {
    return "Goal milestones";
  }

  if (key === "reportReady") {
    return "Report readiness";
  }

  return "Service updates";
}

export function getNotificationPreferenceDescription(
  key: keyof NotificationPreferences,
) {
  if (key === "budgetAlerts") {
    return "Keep overspend and nearing-limit budget signals visible.";
  }

  if (key === "goalUpdates") {
    return "Surface milestone and deadline changes for savings goals.";
  }

  if (key === "reportReady") {
    return "Show when exports and monthly summaries are prepared.";
  }

  return "Show accountant request and booking lifecycle changes.";
}
