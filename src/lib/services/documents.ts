import "server-only";

import {
  Prisma,
  DocumentKind as PrismaDocumentKind,
  DocumentStatus as PrismaDocumentStatus,
} from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import { buildDocumentSummary } from "@/features/documents/document-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { documentCreateInputSchema, documentRecordSchema } from "@/lib/validations/finance";
import type {
  DocumentCreateInput,
  DocumentRecord,
  DocumentSummary,
  DocumentWorkspaceState,
} from "@/types/finance";

export const documentCookieName = "afm-documents";

const documentCookieEntrySchema = documentCreateInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type DocumentCookieEntry = z.infer<typeof documentCookieEntrySchema>;

type DocumentMutationResult = {
  source: DocumentWorkspaceState["source"];
  document: DocumentRecord;
  documents: DocumentRecord[];
  summary: DocumentSummary;
  persistedDocuments: DocumentCookieEntry[];
};

type DemoDocumentSeed = {
  id: string;
  kind: DocumentCreateInput["kind"];
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  status: DocumentCreateInput["status"];
  aiSummary?: string;
  reviewedAt?: string;
  daysAgo: number;
};

const demoDocumentSeedMap = {
  personal: [
    {
      id: "e3d00111-3784-4b22-a844-1f4ab5736001",
      kind: "receipt",
      originalName: "weekly-grocery-receipt.jpg",
      storagePath: "demo-workspace/receipt/2026/04/grocery-receipt.jpg",
      mimeType: "image/jpeg",
      fileSize: 234812,
      status: "review",
      aiSummary: "Receipt appears to be a grocery purchase that should likely map to Food.",
      daysAgo: 1,
    },
    {
      id: "e3d00111-3784-4b22-a844-1f4ab5736002",
      kind: "bill",
      originalName: "internet-bill-april.pdf",
      storagePath: "demo-workspace/bill/2026/04/internet-bill-april.pdf",
      mimeType: "application/pdf",
      fileSize: 421883,
      status: "processing",
      daysAgo: 2,
    },
    {
      id: "e3d00111-3784-4b22-a844-1f4ab5736003",
      kind: "tax_doc",
      originalName: "investment-tax-proof.pdf",
      storagePath: "demo-workspace/tax_doc/2026/04/investment-tax-proof.pdf",
      mimeType: "application/pdf",
      fileSize: 288110,
      status: "completed",
      aiSummary: "Tax proof uploaded and ready to reference during filing prep.",
      reviewedAt: new Date().toISOString(),
      daysAgo: 6,
    },
  ],
  freelancer: [
    {
      id: "f4e11222-4895-4c33-b955-2a5bc6847001",
      kind: "invoice",
      originalName: "nova-labs-invoice.pdf",
      storagePath: "demo-workspace/invoice/2026/04/nova-labs-invoice.pdf",
      mimeType: "application/pdf",
      fileSize: 512903,
      status: "completed",
      aiSummary: "Invoice is complete and can link directly into the income workflow.",
      reviewedAt: new Date().toISOString(),
      daysAgo: 1,
    },
    {
      id: "f4e11222-4895-4c33-b955-2a5bc6847002",
      kind: "receipt",
      originalName: "client-travel-receipt.png",
      storagePath: "demo-workspace/receipt/2026/04/client-travel-receipt.png",
      mimeType: "image/png",
      fileSize: 198220,
      status: "failed",
      daysAgo: 3,
    },
    {
      id: "f4e11222-4895-4c33-b955-2a5bc6847003",
      kind: "tax_doc",
      originalName: "gst-working-notes.pdf",
      storagePath: "demo-workspace/tax_doc/2026/04/gst-working-notes.pdf",
      mimeType: "application/pdf",
      fileSize: 333891,
      status: "review",
      aiSummary: "Notes need accountant review before month-end filing.",
      daysAgo: 5,
    },
  ],
  business: [
    {
      id: "a5f22333-5906-4d44-c066-3b6cd7958001",
      kind: "invoice",
      originalName: "enterprise-retainer-april.pdf",
      storagePath: "demo-workspace/invoice/2026/04/enterprise-retainer-april.pdf",
      mimeType: "application/pdf",
      fileSize: 702118,
      status: "completed",
      aiSummary: "Invoice is ready to sync with collections and reporting.",
      reviewedAt: new Date().toISOString(),
      daysAgo: 1,
    },
    {
      id: "a5f22333-5906-4d44-c066-3b6cd7958002",
      kind: "bill",
      originalName: "ops-software-renewal.pdf",
      storagePath: "demo-workspace/bill/2026/04/ops-software-renewal.pdf",
      mimeType: "application/pdf",
      fileSize: 459874,
      status: "processing",
      daysAgo: 2,
    },
    {
      id: "a5f22333-5906-4d44-c066-3b6cd7958003",
      kind: "tax_doc",
      originalName: "gst-supporting-docs.zip",
      storagePath: "demo-workspace/tax_doc/2026/04/gst-supporting-docs.zip",
      mimeType: "application/zip",
      fileSize: 1324480,
      status: "review",
      aiSummary: "Supporting tax bundle uploaded and waiting for reconciliation review.",
      daysAgo: 4,
    },
  ],
} satisfies Record<"personal" | "freelancer" | "business", DemoDocumentSeed[]>;

function formatLocalDateTime(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(11, 0, 0, 0);

  return value.toISOString();
}

function mapDocumentKind(kind: PrismaDocumentKind): DocumentCreateInput["kind"] {
  if (kind === PrismaDocumentKind.INVOICE) {
    return "invoice";
  }

  if (kind === PrismaDocumentKind.BILL) {
    return "bill";
  }

  if (kind === PrismaDocumentKind.TAX_DOC) {
    return "tax_doc";
  }

  if (kind === PrismaDocumentKind.OTHER) {
    return "other";
  }

  return "receipt";
}

function mapDocumentStatus(status: PrismaDocumentStatus): DocumentCreateInput["status"] {
  if (status === PrismaDocumentStatus.PROCESSING) {
    return "processing";
  }

  if (status === PrismaDocumentStatus.REVIEW) {
    return "review";
  }

  if (status === PrismaDocumentStatus.FAILED) {
    return "failed";
  }

  if (status === PrismaDocumentStatus.COMPLETED) {
    return "completed";
  }

  return "uploaded";
}

function mapDocumentKindToPrisma(kind: DocumentCreateInput["kind"]) {
  if (kind === "invoice") {
    return PrismaDocumentKind.INVOICE;
  }

  if (kind === "bill") {
    return PrismaDocumentKind.BILL;
  }

  if (kind === "tax_doc") {
    return PrismaDocumentKind.TAX_DOC;
  }

  if (kind === "other") {
    return PrismaDocumentKind.OTHER;
  }

  return PrismaDocumentKind.RECEIPT;
}

function mapDocumentStatusToPrisma(status: DocumentCreateInput["status"]) {
  if (status === "processing") {
    return PrismaDocumentStatus.PROCESSING;
  }

  if (status === "review") {
    return PrismaDocumentStatus.REVIEW;
  }

  if (status === "failed") {
    return PrismaDocumentStatus.FAILED;
  }

  if (status === "completed") {
    return PrismaDocumentStatus.COMPLETED;
  }

  return PrismaDocumentStatus.UPLOADED;
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function buildWorkspaceState(
  documents: DocumentRecord[],
  source: DocumentWorkspaceState["source"],
): DocumentWorkspaceState {
  const sortedDocuments = [...documents].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt),
  );

  return {
    documents: sortedDocuments,
    summary: buildDocumentSummary(sortedDocuments),
    source,
  };
}

function buildDemoDocumentEntries(profileType: "personal" | "freelancer" | "business") {
  return demoDocumentSeedMap[profileType].map((seed) => {
    const createdAt = formatLocalDateTime(seed.daysAgo);

    return documentCookieEntrySchema.parse({
      businessProfileId: undefined,
      kind: seed.kind,
      originalName: seed.originalName,
      storagePath: seed.storagePath,
      mimeType: seed.mimeType,
      fileSize: seed.fileSize,
      status: seed.status,
      extractedData: undefined,
      aiSummary: seed.aiSummary,
      reviewedAt: seed.reviewedAt,
      id: seed.id,
      createdAt,
      updatedAt: createdAt,
    });
  });
}

async function readDemoDocuments(profileType: "personal" | "freelancer" | "business") {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(documentCookieName)?.value;

  if (!rawValue) {
    return buildDemoDocumentEntries(profileType);
  }

  try {
    return documentCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoDocumentEntries(profileType);
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
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    return {
      prisma,
      userId: user.id,
    };
  } catch {
    return null;
  }
}

async function readDatabaseDocuments(viewer: ViewerContext) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const documents = await context.prisma.document.findMany({
    where: { userId: context.userId },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    source: "database" as const,
    documents: documents.map((document) =>
      documentRecordSchema.parse({
        id: document.id,
        businessProfileId: document.businessProfileId ?? undefined,
        kind: mapDocumentKind(document.kind),
        originalName: document.originalName,
        storagePath: document.storagePath,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        status: mapDocumentStatus(document.status),
        extractedData:
          document.extractedData && typeof document.extractedData === "object"
            ? (document.extractedData as Record<string, unknown>)
            : undefined,
        aiSummary: normalizeOptionalText(document.aiSummary),
        reviewedAt: document.reviewedAt?.toISOString(),
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      }),
    ),
  };
}

async function getDocumentBaseState(viewer: ViewerContext): Promise<DocumentWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const databaseState = await readDatabaseDocuments(viewer);

  if (databaseState) {
    return buildWorkspaceState(databaseState.documents, "database");
  }

  const demoDocuments = await readDemoDocuments(onboardingState.profileType);

  return buildWorkspaceState(demoDocuments.map((document) => documentRecordSchema.parse(document)), "demo");
}

async function createDatabaseDocument(
  input: DocumentCreateInput,
  viewer: ViewerContext,
): Promise<DocumentMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.document.create({
    data: {
      userId: context.userId,
      businessProfileId: input.businessProfileId || undefined,
      kind: mapDocumentKindToPrisma(input.kind),
      originalName: input.originalName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      status: mapDocumentStatusToPrisma(input.status),
      extractedData: input.extractedData as Prisma.InputJsonValue | undefined,
      aiSummary: normalizeOptionalText(input.aiSummary),
      reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : undefined,
    },
  });

  const state = await getDocumentBaseState(viewer);
  const document = state.documents.find((item) => item.id === created.id);

  if (!document) {
    return null;
  }

  return {
    source: "database",
    document,
    documents: state.documents,
    summary: state.summary,
    persistedDocuments: [],
  };
}

export function getDocumentCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getDocumentWorkspaceState(viewer: ViewerContext): Promise<DocumentWorkspaceState> {
  return getDocumentBaseState(viewer);
}

export async function createDocumentRecord(
  viewer: ViewerContext,
  input: DocumentCreateInput,
): Promise<DocumentMutationResult> {
  const parsedInput = documentCreateInputSchema.parse(input);
  const databaseResult = await createDatabaseDocument(parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const persistedDocuments = await readDemoDocuments(onboardingState.profileType);
  const now = new Date().toISOString();
  const nextDocument = documentCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedDocuments = [nextDocument, ...persistedDocuments];
  const documents = nextPersistedDocuments.map((document) => documentRecordSchema.parse(document));

  return {
    source: "demo",
    document: documents[0],
    documents,
    summary: buildDocumentSummary(documents),
    persistedDocuments: nextPersistedDocuments,
  };
}

export function getSerializedDocumentsCookie(documents: DocumentCookieEntry[]) {
  return JSON.stringify(documentCookieEntrySchema.array().parse(documents));
}
