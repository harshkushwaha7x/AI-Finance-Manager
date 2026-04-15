import "server-only";

import { BillingStatus, ProfileType, SubscriptionPlan } from "@prisma/client";

import { assertAdminAccess } from "@/lib/auth/admin";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getBookingWorkspaceState } from "@/lib/services/appointments";
import { getAccountantWorkspaceState } from "@/lib/services/accountant";
import { getContactLeadRecords } from "@/lib/services/contact-leads";
import { adminOverviewStateSchema } from "@/lib/validations/admin";
import type {
  AdminLeadWorkspaceState,
  AdminOverviewState,
  AdminPackageWorkspaceState,
  AdminUserWorkspaceState,
  SupportUserRecord,
} from "@/types/admin";

const demoSupportUsers: SupportUserRecord[] = [
  {
    id: "c7d11111-aaaa-4444-bbbb-000000000001",
    displayName: "Aanya Kapoor",
    email: "aanya@example.com",
    workspaceName: "Northline Studio",
    profileType: "freelancer",
    onboardingCompleted: true,
    planLabel: "Pro",
    requestCount: 2,
    documentCount: 6,
    latestActivity: "Requested GST setup support and uploaded invoice docs yesterday.",
  },
  {
    id: "c7d11111-aaaa-4444-bbbb-000000000002",
    displayName: "Rohan Mehta",
    email: "rohan@example.com",
    workspaceName: "Vertex Retail",
    profileType: "business",
    onboardingCompleted: true,
    planLabel: "Business",
    requestCount: 3,
    documentCount: 12,
    latestActivity: "Running recurring bookkeeping support and last completed a consultation two days ago.",
  },
  {
    id: "c7d11111-aaaa-4444-bbbb-000000000003",
    displayName: "Neha Singh",
    email: "neha@example.com",
    workspaceName: "Personal workspace",
    profileType: "personal",
    onboardingCompleted: true,
    planLabel: "Free",
    requestCount: 1,
    documentCount: 2,
    latestActivity: "Submitted a finance health check request and is waiting on scheduling.",
  },
];

function mapProfileType(profileType: ProfileType | null | undefined): SupportUserRecord["profileType"] {
  if (profileType === ProfileType.BUSINESS) {
    return "business";
  }

  if (profileType === ProfileType.PERSONAL) {
    return "personal";
  }

  return "freelancer";
}

function mapPlanLabel(plan: SubscriptionPlan | null | undefined, billingStatus: BillingStatus | null | undefined) {
  const baseLabel =
    plan === SubscriptionPlan.BUSINESS ? "Business" : plan === SubscriptionPlan.PRO ? "Pro" : "Free";

  if (!billingStatus || billingStatus === BillingStatus.ACTIVE || billingStatus === BillingStatus.MANUAL) {
    return baseLabel;
  }

  return `${baseLabel} (${billingStatus.toLowerCase().replaceAll("_", " ")})`;
}

async function readDatabaseSupportUsers(): Promise<SupportUserRecord[] | null> {
  if (!appEnv.hasDatabase) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const users = await prisma.user.findMany({
      include: {
        businessProfiles: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            accountantRequests: true,
            documents: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return users.map((user) => {
      const businessProfile = user.businessProfiles[0];
      const subscription = user.subscriptions[0];

      return {
        id: user.id,
        displayName: user.fullName || user.email,
        email: user.email,
        workspaceName:
          businessProfile?.tradeName || businessProfile?.legalName || user.fullName || user.email,
        profileType: mapProfileType(businessProfile?.profileType),
        onboardingCompleted: user.onboardingCompleted,
        planLabel: mapPlanLabel(subscription?.plan, subscription?.billingStatus),
        requestCount: user._count.accountantRequests,
        documentCount: user._count.documents,
        latestActivity: `Updated ${new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(user.updatedAt)}`,
      };
    });
  } catch {
    return null;
  }
}

export async function getAdminOverviewState(viewer: ViewerContext): Promise<AdminOverviewState> {
  assertAdminAccess(viewer);

  const leadState = await getContactLeadRecords();
  const accountantState = await getAccountantWorkspaceState(viewer);
  const bookingState = await getBookingWorkspaceState(viewer);

  return adminOverviewStateSchema.parse({
    metrics: {
      newLeads: leadState.leads.length,
      qualifiedRequests: accountantState.requests.filter((request) =>
        ["qualified", "scheduled", "in_progress"].includes(request.status),
      ).length,
      activePackages: accountantState.packages.filter((pkg) => pkg.isActive).length,
      openFollowUps:
        accountantState.requests.filter((request) =>
          ["new", "qualified", "scheduled"].includes(request.status),
        ).length + leadState.leads.length,
      scheduledConsultations: bookingState.summary.upcomingCount,
    },
    requests: accountantState.requests,
    packages: accountantState.packages,
    leads: leadState.leads,
    source:
      leadState.source === "database" || accountantState.source === "database" || bookingState.source === "database"
        ? "database"
        : "demo",
  });
}

export async function getAdminLeadWorkspaceState(
  viewer: ViewerContext,
): Promise<AdminLeadWorkspaceState> {
  assertAdminAccess(viewer);

  const leadState = await getContactLeadRecords();
  const accountantState = await getAccountantWorkspaceState(viewer);

  return {
    leads: leadState.leads,
    requests: accountantState.requests,
    source:
      leadState.source === "database" || accountantState.source === "database"
        ? "database"
        : "demo",
  };
}

export async function getAdminPackageWorkspaceState(
  viewer: ViewerContext,
): Promise<AdminPackageWorkspaceState> {
  assertAdminAccess(viewer);

  const accountantState = await getAccountantWorkspaceState(viewer);

  return {
    packages: accountantState.packages,
    source: accountantState.source,
  };
}

export async function getAdminUserWorkspaceState(
  viewer: ViewerContext,
): Promise<AdminUserWorkspaceState> {
  assertAdminAccess(viewer);

  const databaseUsers = await readDatabaseSupportUsers();

  if (databaseUsers) {
    return {
      users: databaseUsers,
      source: "database",
    };
  }

  return {
    users: demoSupportUsers,
    source: "demo",
  };
}
