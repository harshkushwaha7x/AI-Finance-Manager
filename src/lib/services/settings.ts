import "server-only";

import { BillingStatus, ProfileType, SubscriptionPlan } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import {
  businessSettingsRecordSchema,
  businessSettingsUpdateSchema,
  notificationPreferencesSchema,
  profileRecordSchema,
  profileSummarySchema,
  profileUpdateSchema,
  profileWorkspaceStateSchema,
  settingsChecklistItemSchema,
  settingsSummarySchema,
  settingsWorkspaceStateSchema,
  subscriptionRecordSchema,
} from "@/lib/validations/settings";
import type {
  BusinessSettingsRecord,
  BusinessSettingsUpdateInput,
  NotificationPreferences,
  ProfileRecord,
  ProfileUpdateInput,
  ProfileWorkspaceState,
  SettingsWorkspaceState,
  SubscriptionRecord,
} from "@/types/settings";

export const profileSettingsCookieName = "afm-profile-settings";
export const workspaceSettingsCookieName = "afm-workspace-settings";

const defaultJoinedAt = "2026-01-01T00:00:00.000Z";

const workspaceSettingsCookieSchema = z.object({
  businessProfile: businessSettingsRecordSchema,
  notificationPreferences: notificationPreferencesSchema,
});

type WorkspaceSettingsCookieState = z.infer<typeof workspaceSettingsCookieSchema>;
type ProfileMutationResult = ProfileWorkspaceState & {
  persistedProfile?: ProfileRecord;
};
type SettingsMutationResult = SettingsWorkspaceState & {
  persistedSettings?: WorkspaceSettingsCookieState;
};

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : "";
}

function buildInvoicePrefix(source: string) {
  const cleaned = source.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "AFM";
  }

  const prefix = parts
    .slice(0, 3)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return prefix || cleaned.slice(0, 3).toUpperCase() || "AFM";
}

function mapPrismaProfileType(profileType: ProfileType | null | undefined) {
  if (profileType === ProfileType.PERSONAL) {
    return "personal" as const;
  }

  if (profileType === ProfileType.BUSINESS) {
    return "business" as const;
  }

  return "freelancer" as const;
}

function mapProfileTypeToPrisma(profileType: BusinessSettingsRecord["profileType"]) {
  if (profileType === "personal") {
    return ProfileType.PERSONAL;
  }

  if (profileType === "business") {
    return ProfileType.BUSINESS;
  }

  return ProfileType.FREELANCER;
}

function mapSubscriptionPlan(plan: SubscriptionPlan | null | undefined) {
  if (plan === SubscriptionPlan.PRO) {
    return "pro" as const;
  }

  if (plan === SubscriptionPlan.BUSINESS) {
    return "business" as const;
  }

  return "free" as const;
}

function mapBillingStatus(status: BillingStatus | null | undefined) {
  if (status === BillingStatus.TRIAL) {
    return "trial" as const;
  }

  if (status === BillingStatus.ACTIVE) {
    return "active" as const;
  }

  if (status === BillingStatus.PAST_DUE) {
    return "past_due" as const;
  }

  if (status === BillingStatus.CANCELLED) {
    return "cancelled" as const;
  }

  return "manual" as const;
}

function buildDefaultSubscription(): SubscriptionRecord {
  return subscriptionRecordSchema.parse({
    plan: "free",
    billingStatus: "manual",
    provider: "manual",
    renewalDate: "",
  });
}

function buildDefaultProfile(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  return profileRecordSchema.parse({
    fullName: onboardingState.fullName || viewer.name || "Finance operator",
    email: viewer.email ?? "demo@ai-finance-manager.local",
    phone: "",
    avatarUrl: "",
    locale: "en-IN",
    defaultCurrency: onboardingState.currency,
    workspaceName: onboardingState.workspaceName || viewer.name || "Finance workspace",
    profileType: onboardingState.profileType,
    onboardingCompleted: onboardingState.completed,
    joinedAt: defaultJoinedAt,
  });
}

function buildDefaultBusinessSettings(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  const workspaceName = onboardingState.workspaceName || viewer.name || "Finance workspace";

  return businessSettingsRecordSchema.parse({
    profileType: onboardingState.profileType,
    legalName: "",
    tradeName: workspaceName,
    gstin: "",
    pan: "",
    businessEmail: viewer.email ?? "",
    businessPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    invoicePrefix: buildInvoicePrefix(workspaceName),
    defaultInvoiceNotes:
      "Thank you for working with us. Please keep this invoice for your monthly accounting records.",
    defaultPaymentTermsDays: 14,
    fiscalYearStartMonth: onboardingState.fiscalYearStartMonth,
  });
}

function buildDefaultNotificationPreferences() {
  return notificationPreferencesSchema.parse({
    budgetAlerts: true,
    goalUpdates: true,
    reportReady: true,
    serviceUpdates: true,
  });
}

function buildProfileSummary(profile: ProfileRecord) {
  const profileFields = [
    Boolean(profile.fullName.trim()),
    Boolean(profile.email.trim()),
    Boolean((profile.phone ?? "").trim()),
    Boolean((profile.avatarUrl ?? "").trim()),
    Boolean(profile.workspaceName.trim()),
  ];
  const preferenceFields = [Boolean(profile.locale.trim()), Boolean(profile.defaultCurrency.trim())];
  const completionPercent = Math.round(
    ((profileFields.filter(Boolean).length + preferenceFields.filter(Boolean).length) /
      (profileFields.length + preferenceFields.length)) *
      100,
  );

  return profileSummarySchema.parse({
    completionPercent,
    contactFieldsCompleted: profileFields.filter(Boolean).length,
    preferencesConfigured: preferenceFields.filter(Boolean).length,
    workspaceModeLabel:
      profile.profileType === "business"
        ? "Small business ops"
        : profile.profileType === "personal"
          ? "Personal finance"
          : "Freelancer workspace",
  });
}

function buildSettingsChecklist(
  businessProfile: BusinessSettingsRecord,
  notificationPreferences: NotificationPreferences,
) {
  const checklist = [
    {
      id: "identity",
      title: "Business identity",
      description: "Trade name, contact details, and country defaults are ready.",
      complete: Boolean(
        (businessProfile.tradeName ?? "").trim() &&
          (businessProfile.businessEmail ?? "").trim() &&
          businessProfile.country.trim(),
      ),
    },
    {
      id: "tax-profile",
      title: "Tax profile",
      description: "GST/PAN and location fields are filled in for accountant handoff.",
      complete: Boolean(
        (businessProfile.gstin ?? "").trim() &&
          (businessProfile.pan ?? "").trim() &&
          (businessProfile.state ?? "").trim() &&
          (businessProfile.city ?? "").trim(),
      ),
    },
    {
      id: "invoice-defaults",
      title: "Invoice defaults",
      description: "Invoice prefix, notes, and payment terms are configured.",
      complete: Boolean(
        (businessProfile.invoicePrefix ?? "").trim() &&
          (businessProfile.defaultInvoiceNotes ?? "").trim() &&
          businessProfile.defaultPaymentTermsDays > 0,
      ),
    },
    {
      id: "notification-prefs",
      title: "Notification preferences",
      description: "Budget, goal, report, and service updates are intentionally configured.",
      complete: Object.values(notificationPreferences).some(Boolean),
    },
  ];

  return checklist.map((item) => settingsChecklistItemSchema.parse(item));
}

function buildSettingsSummary(
  businessProfile: BusinessSettingsRecord,
  notificationPreferences: NotificationPreferences,
) {
  const checklist = buildSettingsChecklist(businessProfile, notificationPreferences);
  const completionPercent = Math.round(
    (checklist.filter((item) => item.complete).length / checklist.length) * 100,
  );

  return settingsSummarySchema.parse({
    completionPercent,
    enabledPreferenceCount: Object.values(notificationPreferences).filter(Boolean).length,
    taxProfileReady: checklist.find((item) => item.id === "tax-profile")?.complete ?? false,
    invoiceDefaultsReady:
      checklist.find((item) => item.id === "invoice-defaults")?.complete ?? false,
  });
}

async function getDatabaseContext(viewer: ViewerContext) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: viewer.email },
      select: { id: true },
    });

    return {
      prisma,
      userId: user?.id ?? null,
    };
  } catch {
    return null;
  }
}

async function readProfileCookieState(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(profileSettingsCookieName)?.value;

  if (!rawValue) {
    return buildDefaultProfile(viewer, onboardingState);
  }

  try {
    return profileRecordSchema.parse(JSON.parse(rawValue));
  } catch {
    return buildDefaultProfile(viewer, onboardingState);
  }
}

async function readWorkspaceSettingsCookieState(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(workspaceSettingsCookieName)?.value;

  if (!rawValue) {
    return workspaceSettingsCookieSchema.parse({
      businessProfile: buildDefaultBusinessSettings(viewer, onboardingState),
      notificationPreferences: buildDefaultNotificationPreferences(),
    });
  }

  try {
    return workspaceSettingsCookieSchema.parse(JSON.parse(rawValue));
  } catch {
    return workspaceSettingsCookieSchema.parse({
      businessProfile: buildDefaultBusinessSettings(viewer, onboardingState),
      notificationPreferences: buildDefaultNotificationPreferences(),
    });
  }
}

function serializeProfileCookie(profile: ProfileRecord) {
  return JSON.stringify(profileRecordSchema.parse(profile));
}

function serializeWorkspaceSettingsCookie(state: WorkspaceSettingsCookieState) {
  return JSON.stringify(workspaceSettingsCookieSchema.parse(state));
}

async function readDatabaseProfileWorkspaceState(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  const context = await getDatabaseContext(viewer);

  if (!context?.userId) {
    return null;
  }

  const user = await context.prisma.user.findUnique({
    where: { id: context.userId },
    include: {
      businessProfiles: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      subscriptions: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  const businessProfile = user.businessProfiles[0];
  const subscription = user.subscriptions[0];
  const profile = profileRecordSchema.parse({
    fullName: user.fullName ?? viewer.name ?? onboardingState.fullName ?? "Finance operator",
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    locale: user.locale,
    defaultCurrency: user.defaultCurrency,
    workspaceName:
      businessProfile?.tradeName ??
      businessProfile?.legalName ??
      onboardingState.workspaceName ??
      user.fullName ??
      viewer.name ??
      "Finance workspace",
    profileType: businessProfile
      ? mapPrismaProfileType(businessProfile.profileType)
      : onboardingState.profileType,
    onboardingCompleted: user.onboardingCompleted,
    joinedAt: user.createdAt.toISOString(),
  });

  return profileWorkspaceStateSchema.parse({
    profile,
    subscription: subscriptionRecordSchema.parse({
      plan: mapSubscriptionPlan(subscription?.plan),
      billingStatus: mapBillingStatus(subscription?.billingStatus),
      provider: subscription?.provider ?? "manual",
      renewalDate: subscription?.renewalDate?.toISOString() ?? "",
    }),
    summary: buildProfileSummary(profile),
    source: "database",
  });
}

async function readDatabaseSettingsWorkspaceState(
  viewer: ViewerContext,
  onboardingState: Awaited<ReturnType<typeof getOnboardingState>>,
) {
  const context = await getDatabaseContext(viewer);

  if (!context?.userId) {
    return null;
  }

  const user = await context.prisma.user.findUnique({
    where: { id: context.userId },
    include: {
      businessProfiles: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      subscriptions: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  const subscription = subscriptionRecordSchema.parse({
    plan: mapSubscriptionPlan(user.subscriptions[0]?.plan),
    billingStatus: mapBillingStatus(user.subscriptions[0]?.billingStatus),
    provider: user.subscriptions[0]?.provider ?? "manual",
    renewalDate: user.subscriptions[0]?.renewalDate?.toISOString() ?? "",
  });

  const businessProfile = user.businessProfiles[0];
  const defaultBusinessSettings = buildDefaultBusinessSettings(viewer, onboardingState);
  const nextBusinessProfile = businessSettingsRecordSchema.parse({
    profileType: businessProfile
      ? mapPrismaProfileType(businessProfile.profileType)
      : onboardingState.profileType,
    legalName: businessProfile?.legalName ?? defaultBusinessSettings.legalName,
    tradeName:
      businessProfile?.tradeName ??
      onboardingState.workspaceName ??
      defaultBusinessSettings.tradeName,
    gstin: businessProfile?.gstin ?? "",
    pan: businessProfile?.pan ?? "",
    businessEmail: businessProfile?.businessEmail ?? viewer.email ?? "",
    businessPhone: businessProfile?.businessPhone ?? "",
    addressLine1: businessProfile?.addressLine1 ?? "",
    addressLine2: businessProfile?.addressLine2 ?? "",
    city: businessProfile?.city ?? "",
    state: businessProfile?.state ?? "",
    postalCode: businessProfile?.postalCode ?? "",
    country: businessProfile?.country ?? "India",
    invoicePrefix:
      businessProfile?.invoicePrefix ??
      buildInvoicePrefix(
        businessProfile?.tradeName ??
          onboardingState.workspaceName ??
          defaultBusinessSettings.tradeName,
      ),
    defaultInvoiceNotes:
      businessProfile?.defaultInvoiceNotes ?? defaultBusinessSettings.defaultInvoiceNotes,
    defaultPaymentTermsDays:
      businessProfile?.defaultPaymentTermsDays ?? defaultBusinessSettings.defaultPaymentTermsDays,
    fiscalYearStartMonth:
      businessProfile?.fiscalYearStartMonth ?? onboardingState.fiscalYearStartMonth,
  });

  const notificationPreferences = notificationPreferencesSchema.parse({
    budgetAlerts: user.budgetAlertsEnabled,
    goalUpdates: user.goalUpdateNotificationsEnabled,
    reportReady: user.reportReadyNotificationsEnabled,
    serviceUpdates: user.serviceUpdateNotificationsEnabled,
  });

  const checklist = buildSettingsChecklist(nextBusinessProfile, notificationPreferences);

  return settingsWorkspaceStateSchema.parse({
    businessProfile: nextBusinessProfile,
    notificationPreferences,
    subscription,
    checklist,
    summary: buildSettingsSummary(nextBusinessProfile, notificationPreferences),
    source: "database",
  });
}

export function getProfileSettingsCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export function getWorkspaceSettingsCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export function getSerializedProfileSettingsCookie(profile: ProfileRecord) {
  return serializeProfileCookie(profile);
}

export function getSerializedWorkspaceSettingsCookie(state: WorkspaceSettingsCookieState) {
  return serializeWorkspaceSettingsCookie(state);
}

export async function getProfileWorkspaceState(
  viewer: ViewerContext,
): Promise<ProfileWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const databaseState = await readDatabaseProfileWorkspaceState(viewer, onboardingState);

  if (databaseState) {
    return databaseState;
  }

  const profile = await readProfileCookieState(viewer, onboardingState);

  return profileWorkspaceStateSchema.parse({
    profile,
    subscription: buildDefaultSubscription(),
    summary: buildProfileSummary(profile),
    source: "demo",
  });
}

export async function getSettingsWorkspaceState(
  viewer: ViewerContext,
): Promise<SettingsWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const databaseState = await readDatabaseSettingsWorkspaceState(viewer, onboardingState);

  if (databaseState) {
    return databaseState;
  }

  const cookieState = await readWorkspaceSettingsCookieState(viewer, onboardingState);
  const checklist = buildSettingsChecklist(
    cookieState.businessProfile,
    cookieState.notificationPreferences,
  );

  return settingsWorkspaceStateSchema.parse({
    businessProfile: cookieState.businessProfile,
    notificationPreferences: cookieState.notificationPreferences,
    subscription: buildDefaultSubscription(),
    checklist,
    summary: buildSettingsSummary(
      cookieState.businessProfile,
      cookieState.notificationPreferences,
    ),
    source: "demo",
  });
}

async function upsertDatabaseUser(viewer: ViewerContext, defaults?: { fullName?: string }) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return null;
  }

  const prisma = getPrismaClient();

  if (!prisma) {
    return null;
  }

  return prisma.user.upsert({
    where: { email: viewer.email },
    update: {
      clerkUserId: viewer.clerkUserId ?? undefined,
      ...(defaults?.fullName ? { fullName: defaults.fullName } : {}),
    },
    create: {
      email: viewer.email,
      clerkUserId: viewer.clerkUserId ?? undefined,
      fullName: defaults?.fullName ?? viewer.name ?? "Finance operator",
    },
  });
}

export async function updateProfileWorkspace(
  viewer: ViewerContext,
  input: ProfileUpdateInput,
): Promise<ProfileMutationResult> {
  const parsedInput = profileUpdateSchema.parse(input);

  if (appEnv.hasDatabase && viewer.isSignedIn && viewer.email) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        await prisma.user.upsert({
          where: { email: viewer.email },
          update: {
            clerkUserId: viewer.clerkUserId ?? undefined,
            fullName: parsedInput.fullName,
            phone: normalizeOptionalText(parsedInput.phone) || null,
            avatarUrl: normalizeOptionalText(parsedInput.avatarUrl) || null,
            locale: parsedInput.locale,
            defaultCurrency: parsedInput.defaultCurrency,
          },
          create: {
            email: viewer.email,
            clerkUserId: viewer.clerkUserId ?? undefined,
            fullName: parsedInput.fullName,
            phone: normalizeOptionalText(parsedInput.phone) || null,
            avatarUrl: normalizeOptionalText(parsedInput.avatarUrl) || null,
            locale: parsedInput.locale,
            defaultCurrency: parsedInput.defaultCurrency,
          },
        });

        return getProfileWorkspaceState(viewer);
      }
    } catch {
      // Fall back to demo persistence.
    }
  }

  const currentState = await getProfileWorkspaceState(viewer);
  const nextProfile = profileRecordSchema.parse({
    ...currentState.profile,
    ...parsedInput,
  });

  return {
    profile: nextProfile,
    subscription: currentState.subscription,
    summary: buildProfileSummary(nextProfile),
    source: "demo",
    persistedProfile: nextProfile,
  };
}

export async function updateBusinessSettingsWorkspace(
  viewer: ViewerContext,
  input: BusinessSettingsUpdateInput,
): Promise<SettingsMutationResult> {
  const parsedInput = businessSettingsUpdateSchema.parse(input);
  const onboardingState = await getOnboardingState(viewer);

  if (appEnv.hasDatabase && viewer.isSignedIn && viewer.email) {
    try {
      const user = await upsertDatabaseUser(viewer);
      const prisma = getPrismaClient();

      if (user && prisma) {
        const existingProfile = await prisma.businessProfile.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });

        if (existingProfile) {
          await prisma.businessProfile.update({
            where: { id: existingProfile.id },
            data: {
              profileType: mapProfileTypeToPrisma(existingProfile.profileType ? mapPrismaProfileType(existingProfile.profileType) : onboardingState.profileType),
              legalName: normalizeOptionalText(parsedInput.legalName) || null,
              tradeName: normalizeOptionalText(parsedInput.tradeName) || null,
              gstin: normalizeOptionalText(parsedInput.gstin) || null,
              pan: normalizeOptionalText(parsedInput.pan) || null,
              businessEmail: normalizeOptionalText(parsedInput.businessEmail) || null,
              businessPhone: normalizeOptionalText(parsedInput.businessPhone) || null,
              addressLine1: normalizeOptionalText(parsedInput.addressLine1) || null,
              addressLine2: normalizeOptionalText(parsedInput.addressLine2) || null,
              city: normalizeOptionalText(parsedInput.city) || null,
              state: normalizeOptionalText(parsedInput.state) || null,
              postalCode: normalizeOptionalText(parsedInput.postalCode) || null,
              country: parsedInput.country,
              invoicePrefix: normalizeOptionalText(parsedInput.invoicePrefix) || null,
              defaultInvoiceNotes: normalizeOptionalText(parsedInput.defaultInvoiceNotes) || null,
              defaultPaymentTermsDays: parsedInput.defaultPaymentTermsDays,
              fiscalYearStartMonth: parsedInput.fiscalYearStartMonth,
            },
          });
        } else {
          await prisma.businessProfile.create({
            data: {
              userId: user.id,
              profileType: mapProfileTypeToPrisma(onboardingState.profileType),
              legalName: normalizeOptionalText(parsedInput.legalName) || null,
              tradeName: normalizeOptionalText(parsedInput.tradeName) || null,
              gstin: normalizeOptionalText(parsedInput.gstin) || null,
              pan: normalizeOptionalText(parsedInput.pan) || null,
              businessEmail: normalizeOptionalText(parsedInput.businessEmail) || null,
              businessPhone: normalizeOptionalText(parsedInput.businessPhone) || null,
              addressLine1: normalizeOptionalText(parsedInput.addressLine1) || null,
              addressLine2: normalizeOptionalText(parsedInput.addressLine2) || null,
              city: normalizeOptionalText(parsedInput.city) || null,
              state: normalizeOptionalText(parsedInput.state) || null,
              postalCode: normalizeOptionalText(parsedInput.postalCode) || null,
              country: parsedInput.country,
              invoicePrefix: normalizeOptionalText(parsedInput.invoicePrefix) || null,
              defaultInvoiceNotes: normalizeOptionalText(parsedInput.defaultInvoiceNotes) || null,
              defaultPaymentTermsDays: parsedInput.defaultPaymentTermsDays,
              fiscalYearStartMonth: parsedInput.fiscalYearStartMonth,
            },
          });
        }

        const subscription = await prisma.subscription.findFirst({
          where: { userId: user.id },
          select: { id: true },
        });

        if (!subscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: SubscriptionPlan.FREE,
              billingStatus: BillingStatus.MANUAL,
            },
          });
        }

        return getSettingsWorkspaceState(viewer);
      }
    } catch {
      // Fall back to demo persistence.
    }
  }

  const currentState = await getSettingsWorkspaceState(viewer);
  const nextBusinessProfile = businessSettingsRecordSchema.parse({
    ...currentState.businessProfile,
    ...parsedInput,
  });
  const nextSettingsState = workspaceSettingsCookieSchema.parse({
    businessProfile: nextBusinessProfile,
    notificationPreferences: currentState.notificationPreferences,
  });

  return {
    businessProfile: nextBusinessProfile,
    notificationPreferences: currentState.notificationPreferences,
    subscription: currentState.subscription,
    checklist: buildSettingsChecklist(
      nextBusinessProfile,
      currentState.notificationPreferences,
    ),
    summary: buildSettingsSummary(
      nextBusinessProfile,
      currentState.notificationPreferences,
    ),
    source: "demo",
    persistedSettings: nextSettingsState,
  };
}

export async function updateNotificationPreferencesWorkspace(
  viewer: ViewerContext,
  input: NotificationPreferences,
): Promise<SettingsMutationResult> {
  const parsedInput = notificationPreferencesSchema.parse(input);

  if (appEnv.hasDatabase && viewer.isSignedIn && viewer.email) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        await prisma.user.upsert({
          where: { email: viewer.email },
          update: {
            clerkUserId: viewer.clerkUserId ?? undefined,
            budgetAlertsEnabled: parsedInput.budgetAlerts,
            goalUpdateNotificationsEnabled: parsedInput.goalUpdates,
            reportReadyNotificationsEnabled: parsedInput.reportReady,
            serviceUpdateNotificationsEnabled: parsedInput.serviceUpdates,
          },
          create: {
            email: viewer.email,
            clerkUserId: viewer.clerkUserId ?? undefined,
            fullName: viewer.name ?? "Finance operator",
            budgetAlertsEnabled: parsedInput.budgetAlerts,
            goalUpdateNotificationsEnabled: parsedInput.goalUpdates,
            reportReadyNotificationsEnabled: parsedInput.reportReady,
            serviceUpdateNotificationsEnabled: parsedInput.serviceUpdates,
          },
        });

        return getSettingsWorkspaceState(viewer);
      }
    } catch {
      // Fall back to demo persistence.
    }
  }

  const currentState = await getSettingsWorkspaceState(viewer);
  const nextSettingsState = workspaceSettingsCookieSchema.parse({
    businessProfile: currentState.businessProfile,
    notificationPreferences: parsedInput,
  });

  return {
    businessProfile: currentState.businessProfile,
    notificationPreferences: parsedInput,
    subscription: currentState.subscription,
    checklist: buildSettingsChecklist(currentState.businessProfile, parsedInput),
    summary: buildSettingsSummary(currentState.businessProfile, parsedInput),
    source: "demo",
    persistedSettings: nextSettingsState,
  };
}
