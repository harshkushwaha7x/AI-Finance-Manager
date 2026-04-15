import "server-only";

import {
  RequestStatus,
  RequestType,
  RequestUrgency,
  type Prisma,
} from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { accountantPackageSeeds } from "@/lib/db/seed-data";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getDocumentWorkspaceState } from "@/lib/services/documents";
import {
  adminPackageInputSchema,
  adminRequestUpdateSchema,
} from "@/lib/validations/admin";
import {
  accountantPackageRecordSchema,
  accountantRequestInputSchema,
  accountantRequestRecordSchema,
  accountantWorkspaceStateSchema,
} from "@/lib/validations/finance";
import type {
  AccountantDocumentOption,
  AccountantPackageRecord,
  AccountantRequestInput,
  AccountantRequestRecord,
  AccountantRequestSummary,
  AccountantWorkspaceState,
  DocumentRecord,
} from "@/types/finance";

export const accountantRequestCookieName = "afm-accountant-requests";
export const accountantPackageCookieName = "afm-accountant-packages";

const accountantRequestCookieEntrySchema = accountantRequestInputSchema.extend({
  id: z.string().uuid(),
  status: z.enum(["new", "qualified", "scheduled", "in_progress", "completed", "cancelled"]),
  adminNotes: z.string().max(500).optional().or(z.literal("")),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type AccountantRequestCookieEntry = z.infer<typeof accountantRequestCookieEntrySchema>;

type AccountantMutationResult = {
  source: AccountantWorkspaceState["source"];
  request: AccountantRequestRecord;
  requests: AccountantRequestRecord[];
  packages: AccountantPackageRecord[];
  summary: AccountantRequestSummary;
  persistedRequests: AccountantRequestCookieEntry[];
};

type AccountantPackageMutationResult = {
  source: "demo" | "database";
  package: AccountantPackageRecord;
  packages: AccountantPackageRecord[];
  persistedPackages: AccountantPackageRecord[];
};

const demoRequestSeedMap = {
  personal: [
    {
      id: "ab9c5c10-44b2-4d4d-b012-01a87bf81001",
      packageSlug: "starter-finance-health-check",
      requestType: "consultation" as const,
      message:
        "Need a second opinion on monthly spending patterns, emergency fund pacing, and whether my current savings split is realistic.",
      urgency: "normal" as const,
      preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "qualified" as const,
      adminNotes: "Short review request with enough context to schedule a first call.",
      documentNames: ["investment-tax-proof.pdf"],
      daysAgo: 2,
    },
  ],
  freelancer: [
    {
      id: "bcad6d21-55c3-4e5e-c123-12b98cf92002",
      packageSlug: "freelancer-tax-and-invoice-setup",
      requestType: "gst" as const,
      message:
        "Need help tightening GST handling, fixing invoice hygiene, and deciding what tax docs I should keep ready each month.",
      urgency: "high" as const,
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "scheduled" as const,
      adminNotes: "Route into freelancer setup lane and keep tax document context attached.",
      documentNames: ["nova-labs-invoice.pdf", "gst-working-notes.pdf"],
      daysAgo: 4,
    },
  ],
  business: [
    {
      id: "cdbf7e32-66d4-4f6f-d234-23ca9dfa3003",
      packageSlug: "monthly-bookkeeping-and-gst-support",
      requestType: "bookkeeping" as const,
      message:
        "Looking for recurring bookkeeping and GST support to keep invoices, reserves, and month-end finance review consistent.",
      urgency: "normal" as const,
      preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_progress" as const,
      adminNotes: "Lead is qualified and waiting on a recurring support proposal.",
      documentNames: ["enterprise-retainer-april.pdf", "gst-supporting-docs.zip"],
      daysAgo: 6,
    },
  ],
} as const;

function formatIsoOffsetDays(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(11, 0, 0, 0);

  return value.toISOString();
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : "";
}

function mapRequestStatus(status: RequestStatus): AccountantRequestRecord["status"] {
  if (status === RequestStatus.QUALIFIED) {
    return "qualified";
  }

  if (status === RequestStatus.SCHEDULED) {
    return "scheduled";
  }

  if (status === RequestStatus.IN_PROGRESS) {
    return "in_progress";
  }

  if (status === RequestStatus.COMPLETED) {
    return "completed";
  }

  if (status === RequestStatus.CANCELLED) {
    return "cancelled";
  }

  return "new";
}

function mapRequestStatusToPrisma(status: AccountantRequestRecord["status"]) {
  if (status === "qualified") {
    return RequestStatus.QUALIFIED;
  }

  if (status === "scheduled") {
    return RequestStatus.SCHEDULED;
  }

  if (status === "in_progress") {
    return RequestStatus.IN_PROGRESS;
  }

  if (status === "completed") {
    return RequestStatus.COMPLETED;
  }

  if (status === "cancelled") {
    return RequestStatus.CANCELLED;
  }

  return RequestStatus.NEW;
}

function mapRequestTypeToPrisma(requestType: AccountantRequestRecord["requestType"]) {
  if (requestType === "gst") {
    return RequestType.GST;
  }

  if (requestType === "bookkeeping") {
    return RequestType.BOOKKEEPING;
  }

  if (requestType === "filing") {
    return RequestType.FILING;
  }

  if (requestType === "custom") {
    return RequestType.CUSTOM;
  }

  return RequestType.CONSULTATION;
}

function mapRequestUrgencyToPrisma(urgency: AccountantRequestRecord["urgency"]) {
  if (urgency === "high") {
    return RequestUrgency.HIGH;
  }

  if (urgency === "low") {
    return RequestUrgency.LOW;
  }

  return RequestUrgency.NORMAL;
}

function mapPrismaRequestType(requestType: RequestType): AccountantRequestRecord["requestType"] {
  if (requestType === RequestType.GST) {
    return "gst";
  }

  if (requestType === RequestType.BOOKKEEPING) {
    return "bookkeeping";
  }

  if (requestType === RequestType.FILING) {
    return "filing";
  }

  if (requestType === RequestType.CUSTOM) {
    return "custom";
  }

  return "consultation";
}

function mapPrismaUrgency(urgency: RequestUrgency): AccountantRequestRecord["urgency"] {
  if (urgency === RequestUrgency.HIGH) {
    return "high";
  }

  if (urgency === RequestUrgency.LOW) {
    return "low";
  }

  return "normal";
}

function buildPackageRecords() {
  const now = new Date().toISOString();

  return accountantPackageSeeds.map((seed, index) =>
    accountantPackageRecordSchema.parse({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      ...seed,
      createdAt: now,
      updatedAt: now,
    }),
  );
}

async function readDemoPackages() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(accountantPackageCookieName)?.value;

  if (!rawValue) {
    return buildPackageRecords();
  }

  try {
    const parsed = accountantPackageRecordSchema.array().parse(JSON.parse(rawValue));

    return parsed.sort((left, right) => {
      if (left.isActive === right.isActive) {
        return left.name.localeCompare(right.name);
      }

      return left.isActive ? -1 : 1;
    });
  } catch {
    return buildPackageRecords();
  }
}

function buildSummary(requests: AccountantRequestRecord[]): AccountantRequestSummary {
  return {
    totalRequests: requests.length,
    newCount: requests.filter((request) => request.status === "new").length,
    activeCount: requests.filter((request) =>
      ["new", "qualified", "scheduled", "in_progress"].includes(request.status),
    ).length,
    scheduledCount: requests.filter((request) => request.status === "scheduled").length,
    completedCount: requests.filter((request) => request.status === "completed").length,
    urgentCount: requests.filter((request) => request.urgency === "high").length,
  };
}

function sortRequestsForWorkspace(requests: AccountantRequestRecord[]) {
  const statusOrder: Record<AccountantRequestRecord["status"], number> = {
    new: 0,
    qualified: 1,
    scheduled: 2,
    in_progress: 3,
    completed: 4,
    cancelled: 5,
  };

  return [...requests].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function buildWorkspaceState(
  packages: AccountantPackageRecord[],
  requests: AccountantRequestRecord[],
  documentOptions: AccountantDocumentOption[],
  source: AccountantWorkspaceState["source"],
): AccountantWorkspaceState {
  const sortedRequests = sortRequestsForWorkspace(requests);

  return accountantWorkspaceStateSchema.parse({
    packages,
    requests: sortedRequests,
    documentOptions,
    summary: buildSummary(sortedRequests),
    source,
  });
}

function serializeRequestsCookie(requests: AccountantRequestCookieEntry[]) {
  return JSON.stringify(accountantRequestCookieEntrySchema.array().parse(requests));
}

function attachDocumentContext(
  entry: AccountantRequestCookieEntry,
  documents: DocumentRecord[],
  packages: AccountantPackageRecord[],
) {
  const packageRecord = packages.find((pkg) => pkg.id === entry.packageId);
  const documentNameMap = new Map(documents.map((document) => [document.id, document.originalName]));
  const derivedDocumentNames = entry.context.documentIds.map((id) => documentNameMap.get(id)).filter(Boolean);

  return accountantRequestRecordSchema.parse({
    ...entry,
    packageLabel: packageRecord?.name ?? "",
    adminNotes: entry.adminNotes,
    context: {
      ...entry.context,
      documentNames: entry.context.documentNames.length
        ? entry.context.documentNames
        : (derivedDocumentNames as string[]),
    },
  });
}

function buildDemoRequestEntries(
  profileType: "personal" | "freelancer" | "business",
  packages: AccountantPackageRecord[],
  workspaceName: string,
  gstin: string,
) {
  return demoRequestSeedMap[profileType].map((seed) => {
    const packageRecord = packages.find((pkg) => pkg.slug === seed.packageSlug);
    const createdAt = formatIsoOffsetDays(seed.daysAgo);

    return accountantRequestCookieEntrySchema.parse({
      id: seed.id,
      businessProfileId: undefined,
      packageId: packageRecord?.id,
      requestType: seed.requestType,
      message: seed.message,
      urgency: seed.urgency,
      preferredDate: seed.preferredDate,
      context: {
        workspaceName,
        gstin,
        documentIds: [],
        documentNames: seed.documentNames,
      },
      status: seed.status,
      adminNotes: seed.adminNotes,
      createdAt,
      updatedAt: createdAt,
    });
  });
}

async function readDemoRequestEntries(
  profileType: "personal" | "freelancer" | "business",
  packages: AccountantPackageRecord[],
  workspaceName: string,
  gstin: string,
) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(accountantRequestCookieName)?.value;

  if (!rawValue) {
    return buildDemoRequestEntries(profileType, packages, workspaceName, gstin);
  }

  try {
    return accountantRequestCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoRequestEntries(profileType, packages, workspaceName, gstin);
  }
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
      include: {
        businessProfiles: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      prisma,
      userId: user.id,
      businessProfileId: user.businessProfiles[0]?.id,
      gstin: normalizeOptionalText(user.businessProfiles[0]?.gstin),
      workspaceName:
        normalizeOptionalText(user.businessProfiles[0]?.tradeName) ||
        normalizeOptionalText(user.businessProfiles[0]?.legalName) ||
        normalizeOptionalText(user.fullName) ||
        normalizeOptionalText(viewer.name),
    };
  } catch {
    return null;
  }
}

async function readDatabasePackages(): Promise<AccountantPackageRecord[] | null> {
  if (!appEnv.hasDatabase) {
    return null;
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return null;
    }

    const packages = await prisma.accountantServicePackage.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    if (!packages.length) {
      return null;
    }

    return packages.map((pkg) =>
      accountantPackageRecordSchema.parse({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        description: pkg.description,
        audience: pkg.audience,
        priceLabel: pkg.priceLabel,
        turnaroundText: pkg.turnaroundText,
        isActive: pkg.isActive,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
      }),
    );
  } catch {
    return null;
  }
}

async function readDatabaseRequests(
  viewer: ViewerContext,
  packages: AccountantPackageRecord[],
  documents: DocumentRecord[],
): Promise<AccountantRequestRecord[] | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const requests = await context.prisma.accountantRequest.findMany({
    where: { userId: context.userId },
    include: {
      package: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return requests.map((request) => {
    const payload =
      request.contextPayload && typeof request.contextPayload === "object"
        ? (request.contextPayload as Record<string, unknown>)
        : {};
    const documentIds = Array.isArray(payload.documentIds)
      ? payload.documentIds.filter((value): value is string => typeof value === "string")
      : [];
    const documentNames = Array.isArray(payload.documentNames)
      ? payload.documentNames.filter((value): value is string => typeof value === "string")
      : [];

    return attachDocumentContext(
      accountantRequestCookieEntrySchema.parse({
        id: request.id,
        businessProfileId: request.businessProfileId ?? undefined,
        packageId: request.packageId ?? undefined,
        requestType: mapPrismaRequestType(request.requestType),
        message: request.message,
        urgency: mapPrismaUrgency(request.urgency),
        preferredDate: request.preferredDate?.toISOString(),
        context: {
          workspaceName:
            typeof payload.workspaceName === "string" ? payload.workspaceName : context.workspaceName,
          gstin: typeof payload.gstin === "string" ? payload.gstin : context.gstin,
          documentIds,
          documentNames,
        },
        status: mapRequestStatus(request.status),
        adminNotes: normalizeOptionalText(request.adminNotes),
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      }),
      documents,
      packages,
    );
  });
}

async function getPackages(): Promise<AccountantPackageRecord[]> {
  const databasePackages = await readDatabasePackages();

  if (databasePackages?.length) {
    return databasePackages;
  }

  return readDemoPackages();
}

async function getAccountantBaseState(
  viewer: ViewerContext,
): Promise<AccountantWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const documentState = await getDocumentWorkspaceState(viewer);
  const documentOptions = documentState.documents.map((document) => ({
    id: document.id,
    originalName: document.originalName,
    kind: document.kind,
    status: document.status,
    createdAt: document.createdAt,
    aiSummary: document.aiSummary,
  }));
  const packages = await getPackages();
  const databaseContext = await getDatabaseContext(viewer);
  const databaseRequests = await readDatabaseRequests(viewer, packages, documentState.documents);

  if (databaseRequests) {
    return buildWorkspaceState(packages, databaseRequests, documentOptions, "database");
  }

  const demoRequests = await readDemoRequestEntries(
    onboardingState.profileType,
    packages,
    onboardingState.workspaceName || viewer.name || "Finance workspace",
    databaseContext?.gstin || "",
  );

  return buildWorkspaceState(
    packages,
    demoRequests.map((entry) => attachDocumentContext(entry, documentState.documents, packages)),
    documentOptions,
    "demo",
  );
}

async function createDatabaseRequest(
  viewer: ViewerContext,
  input: AccountantRequestInput,
  packages: AccountantPackageRecord[],
): Promise<AccountantMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.accountantRequest.create({
    data: {
      userId: context.userId,
      businessProfileId: input.businessProfileId || context.businessProfileId || undefined,
      packageId: input.packageId || undefined,
      requestType: mapRequestTypeToPrisma(input.requestType),
      message: input.message,
      urgency: mapRequestUrgencyToPrisma(input.urgency),
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      status: RequestStatus.NEW,
      contextPayload: {
        workspaceName: input.context.workspaceName,
        gstin: input.context.gstin,
        documentIds: input.context.documentIds,
        documentNames: input.context.documentNames,
      } satisfies Prisma.InputJsonValue,
    },
  });
  const state = await getAccountantBaseState(viewer);
  const request = state.requests.find((candidate) => candidate.id === created.id);

  if (!request) {
    return null;
  }

  return {
    source: "database",
    request,
    requests: state.requests,
    packages,
    summary: state.summary,
    persistedRequests: [],
  };
}

export function getAccountantCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export function getAccountantPackageCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getAccountantWorkspaceState(
  viewer: ViewerContext,
): Promise<AccountantWorkspaceState> {
  return getAccountantBaseState(viewer);
}

export async function createAccountantRequest(
  viewer: ViewerContext,
  input: AccountantRequestInput,
): Promise<AccountantMutationResult> {
  const parsedInput = accountantRequestInputSchema.parse(input);
  const packages = await getPackages();
  const documentState = await getDocumentWorkspaceState(viewer);
  const databaseResult = await createDatabaseRequest(
    viewer,
    parsedInput,
    packages,
  );

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedRequests = await readDemoRequestEntries(
    onboardingState.profileType,
    packages,
    onboardingState.workspaceName || viewer.name || "Finance workspace",
    parsedInput.context.gstin ?? "",
  );
  const now = new Date().toISOString();
  const nextRequest = accountantRequestCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    status: "new",
    adminNotes: "",
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedRequests = [nextRequest, ...persistedRequests];
  const requests = nextPersistedRequests.map((entry) =>
    attachDocumentContext(entry, documentState.documents, packages),
  );
  const documentOptions = documentState.documents.map((document) => ({
    id: document.id,
    originalName: document.originalName,
    kind: document.kind,
    status: document.status,
    createdAt: document.createdAt,
    aiSummary: document.aiSummary,
  }));
  const state = buildWorkspaceState(packages, requests, documentOptions, "demo");

  return {
    source: "demo",
    request: state.requests[0],
    requests: state.requests,
    packages,
    summary: state.summary,
    persistedRequests: nextPersistedRequests,
  };
}

export function getSerializedAccountantRequestsCookie(
  requests: AccountantRequestCookieEntry[],
) {
  return serializeRequestsCookie(requests);
}

export function getSerializedAccountantPackagesCookie(
  packages: AccountantPackageRecord[],
) {
  return JSON.stringify(
    accountantPackageRecordSchema.array().parse(packages).sort((left, right) => {
      if (left.isActive === right.isActive) {
        return left.name.localeCompare(right.name);
      }

      return left.isActive ? -1 : 1;
    }),
  );
}

export async function createAccountantPackage(input: unknown): Promise<AccountantPackageMutationResult> {
  const parsedInput = adminPackageInputSchema.parse(input);

  if (appEnv.hasDatabase) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        const created = await prisma.accountantServicePackage.create({
          data: parsedInput,
        });
        const packages = await getPackages();
        const packageRecord =
          packages.find((item) => item.id === created.id) ??
          accountantPackageRecordSchema.parse({
            id: created.id,
            ...parsedInput,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
          });

        return {
          source: "database",
          package: packageRecord,
          packages,
          persistedPackages: [],
        };
      }
    } catch {
      // Fall back to demo persistence below.
    }
  }

  const existingPackages = await readDemoPackages();
  const now = new Date().toISOString();
  const nextPackage = accountantPackageRecordSchema.parse({
    id: crypto.randomUUID(),
    ...parsedInput,
    createdAt: now,
    updatedAt: now,
  });
  const nextPackages = [...existingPackages, nextPackage].sort((left, right) => left.name.localeCompare(right.name));

  return {
    source: "demo",
    package: nextPackage,
    packages: nextPackages,
    persistedPackages: nextPackages,
  };
}

export async function updateAccountantPackage(
  packageId: string,
  input: unknown,
): Promise<AccountantPackageMutationResult | null> {
  const parsedInput = adminPackageInputSchema.parse(input);

  if (appEnv.hasDatabase) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        const existing = await prisma.accountantServicePackage.findUnique({
          where: { id: packageId },
        });

        if (!existing) {
          return null;
        }

        const updated = await prisma.accountantServicePackage.update({
          where: { id: packageId },
          data: parsedInput,
        });
        const packages = await getPackages();
        const packageRecord =
          packages.find((item) => item.id === updated.id) ??
          accountantPackageRecordSchema.parse({
            id: updated.id,
            ...parsedInput,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          });

        return {
          source: "database",
          package: packageRecord,
          packages,
          persistedPackages: [],
        };
      }
    } catch {
      // Fall back to demo persistence below.
    }
  }

  const existingPackages = await readDemoPackages();
  const targetPackage = existingPackages.find((item) => item.id === packageId);

  if (!targetPackage) {
    return null;
  }

  const nextPackages = existingPackages.map((item) =>
    item.id === packageId
      ? accountantPackageRecordSchema.parse({
          ...item,
          ...parsedInput,
          updatedAt: new Date().toISOString(),
        })
      : item,
  );
  const updatedPackage = nextPackages.find((item) => item.id === packageId);

  if (!updatedPackage) {
    return null;
  }

  return {
    source: "demo",
    package: updatedPackage,
    packages: nextPackages,
    persistedPackages: nextPackages,
  };
}

export async function updateAccountantRequest(
  viewer: ViewerContext,
  requestId: string,
  input: unknown,
): Promise<AccountantMutationResult | null> {
  const parsedInput = adminRequestUpdateSchema.parse(input);
  const packages = await getPackages();
  const documentState = await getDocumentWorkspaceState(viewer);

  if (appEnv.hasDatabase && viewer.isSignedIn && viewer.email) {
    try {
      const prisma = getPrismaClient();

      if (prisma) {
        const existing = await prisma.accountantRequest.findFirst({
          where: { id: requestId },
          select: { id: true },
        });

        if (!existing) {
          return null;
        }

        await prisma.accountantRequest.update({
          where: { id: requestId },
          data: {
            status: mapRequestStatusToPrisma(parsedInput.status),
            adminNotes: parsedInput.adminNotes || null,
          },
        });

        const state = await getAccountantBaseState(viewer);
        const request = state.requests.find((item) => item.id === requestId);

        if (!request) {
          return null;
        }

        return {
          source: "database",
          request,
          requests: state.requests,
          packages,
          summary: state.summary,
          persistedRequests: [],
        };
      }
    } catch {
      // Fall back to demo persistence below.
    }
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedRequests = await readDemoRequestEntries(
    onboardingState.profileType,
    packages,
    onboardingState.workspaceName || viewer.name || "Finance workspace",
    "",
  );
  const targetRequest = persistedRequests.find((item) => item.id === requestId);

  if (!targetRequest) {
    return null;
  }

  const nextPersistedRequests = persistedRequests.map((item) =>
    item.id === requestId
      ? accountantRequestCookieEntrySchema.parse({
          ...item,
          status: parsedInput.status,
          adminNotes: parsedInput.adminNotes || "",
          updatedAt: new Date().toISOString(),
        })
      : item,
  );
  const requests = nextPersistedRequests.map((entry) =>
    attachDocumentContext(entry, documentState.documents, packages),
  );
  const documentOptions = documentState.documents.map((document) => ({
    id: document.id,
    originalName: document.originalName,
    kind: document.kind,
    status: document.status,
    createdAt: document.createdAt,
    aiSummary: document.aiSummary,
  }));
  const state = buildWorkspaceState(packages, requests, documentOptions, "demo");
  const request = state.requests.find((item) => item.id === requestId);

  if (!request) {
    return null;
  }

  return {
    source: "demo",
    request,
    requests: state.requests,
    packages,
    summary: state.summary,
    persistedRequests: nextPersistedRequests,
  };
}
