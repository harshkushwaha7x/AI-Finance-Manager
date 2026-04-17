import type {
  ProfileRecord,
  SettingsBillingStatus,
  SettingsProfileType,
  SettingsSubscriptionPlan,
} from "@/types/settings";

export function formatProfileTypeLabel(profileType: SettingsProfileType) {
  if (profileType === "business") {
    return "Small business ops";
  }

  if (profileType === "personal") {
    return "Personal finance";
  }

  return "Freelancer workspace";
}

export function formatSubscriptionPlan(plan: SettingsSubscriptionPlan) {
  if (plan === "business") {
    return "Business";
  }

  if (plan === "pro") {
    return "Pro";
  }

  return "Free";
}

export function formatBillingStatus(status: SettingsBillingStatus) {
  return status
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getProfileIdentityCoverage(profile: ProfileRecord) {
  const items = [
    Boolean(profile.fullName.trim()),
    Boolean(profile.email.trim()),
    Boolean((profile.phone ?? "").trim()),
    Boolean((profile.avatarUrl ?? "").trim()),
    Boolean(profile.workspaceName.trim()),
  ];

  return `${items.filter(Boolean).length}/${items.length} fields`;
}
