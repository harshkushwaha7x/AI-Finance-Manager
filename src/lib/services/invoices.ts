import "server-only";

import {
  InvoiceStatus,
  ProfileType,
} from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import {
  buildInvoiceSummary,
  buildInvoiceSyncNote,
  calculateInvoiceLineTax,
  calculateInvoiceLineTotal,
  calculateInvoiceTotals,
  createDefaultInvoiceNumber,
  findLinkedInvoiceIncomeTransaction,
  getDefaultInvoiceDate,
  getDefaultInvoiceDueDate,
  getInvoiceDueInDays,
  getInvoiceStatus,
  sortInvoicesForWorkspace,
} from "@/features/invoices/invoice-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import {
  createTransaction,
  deleteTransaction,
  getTransactionWorkspaceState,
} from "@/lib/services/transactions";
import {
  invoiceInputSchema,
  invoiceRecordSchema,
} from "@/lib/validations/finance";
import type {
  InvoiceInput,
  InvoiceRecord,
  InvoiceSummary,
  InvoiceWorkspaceState,
  TransactionCategoryOption,
  TransactionRecord,
} from "@/types/finance";

export const invoiceCookieName = "afm-invoices";

const invoiceCookieEntrySchema = invoiceInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type InvoiceCookieEntry = z.infer<typeof invoiceCookieEntrySchema>;

type InvoiceMutationResult = {
  source: InvoiceWorkspaceState["source"];
  invoice: InvoiceRecord;
  invoices: InvoiceRecord[];
  summary: InvoiceSummary;
  persistedInvoices: InvoiceCookieEntry[];
  syncedTransactions?: TransactionRecord[];
};

type InvoiceDeleteResult = InvoiceWorkspaceState & {
  persistedInvoices: InvoiceCookieEntry[];
  syncedTransactions?: TransactionRecord[];
};

type DemoInvoiceSeed = Omit<InvoiceCookieEntry, "createdAt" | "updatedAt" | "businessProfileId"> & {
  daysAgo: number;
};

const demoInvoiceSeedMap = {
  personal: [
    {
      id: "a8e30e9e-694f-4ca0-8f4e-3a483f761001",
      invoiceNumber: "AFM-2026-001",
      customerName: "Personal training client",
      customerEmail: "client@example.com",
      customerGstin: "",
      issueDate: getDefaultInvoiceDate(),
      dueDate: getDefaultInvoiceDueDate(),
      currency: "INR",
      status: "sent",
      notes: "One-off consulting engagement billed from the personal finance demo.",
      items: [
        {
          description: "Personal finance coaching session",
          quantity: 2,
          unitPrice: 4500,
          gstRate: 18,
        },
      ],
      daysAgo: 3,
    },
  ],
  freelancer: [
    {
      id: "b9f41faf-7a50-4db1-9f5f-4b5940762001",
      invoiceNumber: "AFM-2026-011",
      customerName: "Nova Labs",
      customerEmail: "finance@novalabs.example",
      customerGstin: "29ABCDE1234F1Z5",
      issueDate: "2026-04-02",
      dueDate: "2026-04-09",
      currency: "INR",
      status: "paid",
      notes: "Monthly product design retainer.",
      items: [
        {
          description: "Product design retainer",
          quantity: 1,
          unitPrice: 58000,
          gstRate: 18,
        },
      ],
      daysAgo: 9,
    },
    {
      id: "b9f41faf-7a50-4db1-9f5f-4b5940762002",
      invoiceNumber: "AFM-2026-012",
      customerName: "Indigo Workshop",
      customerEmail: "accounts@indigoworkshop.example",
      customerGstin: "",
      issueDate: "2026-04-07",
      dueDate: "2026-04-14",
      currency: "INR",
      status: "sent",
      notes: "Workshop planning and facilitation invoice.",
      items: [
        {
          description: "Design workshop facilitation",
          quantity: 1,
          unitPrice: 22500,
          gstRate: 18,
        },
      ],
      daysAgo: 4,
    },
  ],
  business: [
    {
      id: "ca0520b0-8b61-4ec2-a06f-5c6a51873001",
      invoiceNumber: "AFM-2026-101",
      customerName: "Aster Retail",
      customerEmail: "finance@asterretail.example",
      customerGstin: "27AAAAA0000A1Z5",
      issueDate: "2026-04-01",
      dueDate: "2026-04-08",
      currency: "INR",
      status: "paid",
      notes: "Enterprise services retainer for April.",
      items: [
        {
          description: "Enterprise services retainer",
          quantity: 1,
          unitPrice: 184000,
          gstRate: 18,
        },
      ],
      daysAgo: 10,
    },
    {
      id: "ca0520b0-8b61-4ec2-a06f-5c6a51873002",
      invoiceNumber: "AFM-2026-102",
      customerName: "Channel partner",
      customerEmail: "ops@channelpartner.example",
      customerGstin: "",
      issueDate: "2026-04-05",
      dueDate: "2026-04-11",
      currency: "INR",
      status: "sent",
      notes: "Quarterly partner payout invoice.",
      items: [
        {
          description: "Partner success payout",
          quantity: 1,
          unitPrice: 96000,
          gstRate: 18,
        },
      ],
      daysAgo: 6,
    },
  ],
} satisfies Record<"personal" | "freelancer" | "business", DemoInvoiceSeed[]>;

function formatLocalDateTime(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(11, 0, 0, 0);

  return value.toISOString();
}

function mapInvoiceStatus(status: InvoiceStatus): InvoiceRecord["status"] {
  if (status === InvoiceStatus.PAID) {
    return "paid";
  }

  if (status === InvoiceStatus.OVERDUE) {
    return "overdue";
  }

  if (status === InvoiceStatus.CANCELLED) {
    return "cancelled";
  }

  if (status === InvoiceStatus.SENT) {
    return "sent";
  }

  return "draft";
}

function mapInvoiceStatusToPrisma(
  status: InvoiceRecord["status"],
  dueDate?: string,
) {
  const resolvedStatus = getInvoiceStatus(status, dueDate);

  if (resolvedStatus === "paid") {
    return InvoiceStatus.PAID;
  }

  if (resolvedStatus === "overdue") {
    return InvoiceStatus.OVERDUE;
  }

  if (resolvedStatus === "cancelled") {
    return InvoiceStatus.CANCELLED;
  }

  if (resolvedStatus === "sent") {
    return InvoiceStatus.SENT;
  }

  return InvoiceStatus.DRAFT;
}

function mapProfileTypeToPrisma(profileType: "personal" | "freelancer" | "business") {
  if (profileType === "personal") {
    return ProfileType.PERSONAL;
  }

  if (profileType === "business") {
    return ProfileType.BUSINESS;
  }

  return ProfileType.FREELANCER;
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : "";
}

function buildInvoiceRecord(
  entry: InvoiceCookieEntry,
  transactions: TransactionRecord[],
) {
  const items = entry.items.map((item, index) => ({
    id: `${entry.id}-item-${index + 1}`,
    ...item,
    taxAmount: calculateInvoiceLineTax(item),
    lineTotal: calculateInvoiceLineTotal(item),
  }));
  const totals = calculateInvoiceTotals(entry.items);
  const linkedIncomeTransaction = findLinkedInvoiceIncomeTransaction(entry.id, transactions);
  const resolvedStatus = getInvoiceStatus(entry.status, entry.dueDate || undefined);

  return invoiceRecordSchema.parse({
    ...entry,
    dueDate: entry.dueDate || "",
    status: resolvedStatus,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    totalAmount: totals.totalAmount,
    dueInDays: getInvoiceDueInDays(entry.dueDate || undefined),
    linkedIncomeTransactionId:
      resolvedStatus === "paid" ? linkedIncomeTransaction?.id : undefined,
    items,
  });
}

function buildWorkspaceState(
  invoices: InvoiceRecord[],
  source: InvoiceWorkspaceState["source"],
): InvoiceWorkspaceState {
  const sortedInvoices = sortInvoicesForWorkspace(invoices);

  return {
    invoices: sortedInvoices,
    summary: buildInvoiceSummary(sortedInvoices),
    source,
  };
}

function serializeInvoicesCookie(invoices: InvoiceCookieEntry[]) {
  return JSON.stringify(invoiceCookieEntrySchema.array().parse(invoices));
}

function buildDemoInvoiceEntries(profileType: "personal" | "freelancer" | "business") {
  return demoInvoiceSeedMap[profileType].map((seed) => {
    const createdAt = formatLocalDateTime(seed.daysAgo);

    return invoiceCookieEntrySchema.parse({
      businessProfileId: undefined,
      invoiceNumber: seed.invoiceNumber,
      customerName: seed.customerName,
      customerEmail: seed.customerEmail,
      customerGstin: seed.customerGstin,
      issueDate: seed.issueDate,
      dueDate: seed.dueDate,
      currency: seed.currency,
      status: seed.status,
      notes: seed.notes,
      items: seed.items,
      id: seed.id,
      createdAt,
      updatedAt: createdAt,
    });
  });
}

async function readDemoInvoices(profileType: "personal" | "freelancer" | "business") {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(invoiceCookieName)?.value;

  if (!rawValue) {
    return buildDemoInvoiceEntries(profileType);
  }

  try {
    return invoiceCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoInvoiceEntries(profileType);
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
      user,
      businessProfileId: user.businessProfiles[0]?.id ?? null,
    };
  } catch {
    return null;
  }
}

async function resolveBusinessProfileId(
  viewer: ViewerContext,
  requestedBusinessProfileId?: string,
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  if (requestedBusinessProfileId) {
    return {
      ...context,
      businessProfileId: requestedBusinessProfileId,
    };
  }

  if (context.businessProfileId) {
    return context;
  }

  const onboardingState = await getOnboardingState(viewer);
  const createdProfile = await context.prisma.businessProfile.create({
    data: {
      userId: context.user.id,
      profileType: mapProfileTypeToPrisma(onboardingState.profileType),
      tradeName: onboardingState.workspaceName || viewer.name || "Finance workspace",
      legalName: onboardingState.workspaceName || viewer.name || "Finance workspace",
      fiscalYearStartMonth: onboardingState.fiscalYearStartMonth,
    },
    select: { id: true },
  });

  return {
    ...context,
    businessProfileId: createdProfile.id,
  };
}

async function readDatabaseInvoices(
  viewer: ViewerContext,
  transactions: TransactionRecord[],
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const invoices = await context.prisma.invoice.findMany({
    where: { userId: context.user.id },
    include: { items: true },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
  });

  return {
    source: "database" as const,
    invoices: invoices.map((invoice) =>
      buildInvoiceRecord(
        invoiceCookieEntrySchema.parse({
          id: invoice.id,
          businessProfileId: invoice.businessProfileId,
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerEmail: normalizeOptionalText(invoice.customerEmail),
          customerGstin: normalizeOptionalText(invoice.customerGstin),
          issueDate: invoice.issueDate.toISOString().slice(0, 10),
          dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
          currency: invoice.currency,
          status: mapInvoiceStatus(invoice.status),
          notes: normalizeOptionalText(invoice.notes),
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            gstRate: Number(item.gstRate),
          })),
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
        }),
        transactions,
      ),
    ),
  };
}

async function getInvoiceBaseState(
  viewer: ViewerContext,
  providedTransactions?: TransactionRecord[],
): Promise<InvoiceWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const transactionState =
    providedTransactions !== undefined
      ? { transactions: providedTransactions }
      : await getTransactionWorkspaceState(viewer);
  const databaseState = await readDatabaseInvoices(viewer, transactionState.transactions);

  if (databaseState) {
    return buildWorkspaceState(databaseState.invoices, "database");
  }

  const demoInvoices = await readDemoInvoices(onboardingState.profileType);

  return buildWorkspaceState(
    demoInvoices.map((invoice) => buildInvoiceRecord(invoice, transactionState.transactions)),
    "demo",
  );
}

function validateUniqueInvoiceNumber(
  invoices: Array<Pick<InvoiceCookieEntry, "id" | "invoiceNumber">>,
  invoiceNumber: string,
  invoiceId?: string,
) {
  const conflict = invoices.find(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase() &&
      invoice.id !== invoiceId,
  );

  if (conflict) {
    throw new Error("Invoice number already exists in this workspace.");
  }
}

function findPreferredIncomeCategory(categories: TransactionCategoryOption[]) {
  return (
    categories.find((category) => category.kind === "income" && category.slug === "retainers") ??
    categories.find((category) => category.kind === "income") ??
    null
  );
}

async function syncInvoicePaymentTransaction(
  viewer: ViewerContext,
  invoice: InvoiceRecord,
  transactions: TransactionRecord[],
  categories: TransactionCategoryOption[],
) {
  const existingTransaction = findLinkedInvoiceIncomeTransaction(invoice.id, transactions);

  if (invoice.status === "paid") {
    if (existingTransaction) {
      return {
        transactions,
      };
    }

    const category = findPreferredIncomeCategory(categories);
    const mutation = await createTransaction(viewer, {
      businessProfileId: invoice.businessProfileId,
      categoryId: category?.id,
      type: "income",
      source: "invoice",
      title: `Invoice ${invoice.invoiceNumber} payment`,
      description: `Payment received from ${invoice.customerName}`,
      merchantName: invoice.customerName,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      transactionDate: invoice.dueDate || invoice.issueDate,
      paymentMethod: "Bank transfer",
      status: "cleared",
      recurring: false,
      recurringInterval: "",
      notes: buildInvoiceSyncNote(invoice.id, invoice.invoiceNumber),
    });

    return {
      transactions: mutation.transactions,
    };
  }

  if (!existingTransaction) {
    return {
      transactions,
    };
  }

  const mutation = await deleteTransaction(viewer, existingTransaction.id);

  return {
    transactions: mutation?.transactions ?? transactions,
  };
}

async function createDatabaseInvoice(
  viewer: ViewerContext,
  input: InvoiceInput,
): Promise<InvoiceMutationResult | null> {
  const context = await resolveBusinessProfileId(viewer, input.businessProfileId);

  if (!context?.businessProfileId) {
    return null;
  }

  const existingInvoices = await context.prisma.invoice.findMany({
    where: { userId: context.user.id },
    select: { id: true, invoiceNumber: true },
  });

  validateUniqueInvoiceNumber(existingInvoices, input.invoiceNumber);

  const totals = calculateInvoiceTotals(input.items);
  const created = await context.prisma.invoice.create({
    data: {
      userId: context.user.id,
      businessProfileId: context.businessProfileId,
      invoiceNumber: input.invoiceNumber,
      customerName: input.customerName,
      customerEmail: normalizeOptionalText(input.customerEmail) || undefined,
      customerGstin: normalizeOptionalText(input.customerGstin) || undefined,
      issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : undefined,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      currency: input.currency,
      status: mapInvoiceStatusToPrisma(input.status, input.dueDate || undefined),
      notes: normalizeOptionalText(input.notes) || undefined,
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          lineTotal: calculateInvoiceLineTotal(item),
        })),
      },
    },
  });

  let transactionState = await getTransactionWorkspaceState(viewer);
  const draftInvoice = buildInvoiceRecord(
    invoiceCookieEntrySchema.parse({
      id: created.id,
      businessProfileId: context.businessProfileId,
      ...input,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }),
    transactionState.transactions,
  );

  const synced = await syncInvoicePaymentTransaction(
    viewer,
    draftInvoice,
    transactionState.transactions,
    transactionState.categories,
  );

  if (synced.transactions !== transactionState.transactions) {
    transactionState = await getTransactionWorkspaceState(viewer);
  }

  const state = await getInvoiceBaseState(viewer, synced.transactions);
  const invoice = state.invoices.find((item) => item.id === created.id);

  if (!invoice) {
    return null;
  }

  return {
    source: "database",
    invoice,
    invoices: state.invoices,
    summary: state.summary,
    persistedInvoices: [],
  };
}

async function updateDatabaseInvoice(
  viewer: ViewerContext,
  invoiceId: string,
  input: InvoiceInput,
): Promise<InvoiceMutationResult | null> {
  const context = await resolveBusinessProfileId(viewer, input.businessProfileId);

  if (!context?.businessProfileId) {
    return null;
  }

  const existing = await context.prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId: context.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const existingInvoices = await context.prisma.invoice.findMany({
    where: { userId: context.user.id },
    select: { id: true, invoiceNumber: true },
  });

  validateUniqueInvoiceNumber(existingInvoices, input.invoiceNumber, invoiceId);

  const totals = calculateInvoiceTotals(input.items);
  await context.prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      businessProfileId: context.businessProfileId,
      invoiceNumber: input.invoiceNumber,
      customerName: input.customerName,
      customerEmail: normalizeOptionalText(input.customerEmail) || undefined,
      customerGstin: normalizeOptionalText(input.customerGstin) || undefined,
      issueDate: new Date(`${input.issueDate}T00:00:00.000Z`),
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      currency: input.currency,
      status: mapInvoiceStatusToPrisma(input.status, input.dueDate || undefined),
      notes: normalizeOptionalText(input.notes) || undefined,
      items: {
        deleteMany: {},
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          lineTotal: calculateInvoiceLineTotal(item),
        })),
      },
    },
  });

  const transactionState = await getTransactionWorkspaceState(viewer);
  const synced = await syncInvoicePaymentTransaction(
    viewer,
    buildInvoiceRecord(
      invoiceCookieEntrySchema.parse({
        id: invoiceId,
        businessProfileId: context.businessProfileId,
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      transactionState.transactions,
    ),
    transactionState.transactions,
    transactionState.categories,
  );
  const state = await getInvoiceBaseState(viewer, synced.transactions);
  const invoice = state.invoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    return null;
  }

  return {
    source: "database",
    invoice,
    invoices: state.invoices,
    summary: state.summary,
    persistedInvoices: [],
  };
}

async function deleteDatabaseInvoice(
  viewer: ViewerContext,
  invoiceId: string,
): Promise<InvoiceDeleteResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId: context.user.id,
    },
    select: { id: true, invoiceNumber: true },
  });

  if (!existing) {
    return null;
  }

  const transactionState = await getTransactionWorkspaceState(viewer);
  const linkedIncomeTransaction = findLinkedInvoiceIncomeTransaction(
    invoiceId,
    transactionState.transactions,
  );

  if (linkedIncomeTransaction) {
    await deleteTransaction(viewer, linkedIncomeTransaction.id);
  }

  await context.prisma.invoice.delete({
    where: { id: invoiceId },
  });

  const state = await getInvoiceBaseState(viewer);

  return {
    ...state,
    persistedInvoices: [],
  };
}

export function getInvoiceCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getInvoiceWorkspaceState(
  viewer: ViewerContext,
): Promise<InvoiceWorkspaceState> {
  return getInvoiceBaseState(viewer);
}

export async function createInvoice(
  viewer: ViewerContext,
  input: InvoiceInput,
): Promise<InvoiceMutationResult> {
  const parsedInput = invoiceInputSchema.parse(input);
  const databaseResult = await createDatabaseInvoice(viewer, parsedInput);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const persistedInvoices = await readDemoInvoices(onboardingState.profileType);

  validateUniqueInvoiceNumber(persistedInvoices, parsedInput.invoiceNumber);

  const now = new Date().toISOString();
  const nextInvoice = invoiceCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedInvoices = [nextInvoice, ...persistedInvoices];
  const draftInvoice = buildInvoiceRecord(nextInvoice, transactionState.transactions);
  const synced = await syncInvoicePaymentTransaction(
    viewer,
    draftInvoice,
    transactionState.transactions,
    transactionState.categories,
  );
  const invoices = nextPersistedInvoices.map((invoice) =>
    buildInvoiceRecord(invoice, synced.transactions),
  );
  const state = buildWorkspaceState(invoices, "demo");
  const createdInvoice = state.invoices.find((invoice) => invoice.id === nextInvoice.id);

  if (!createdInvoice) {
    throw new Error("Unable to create the invoice.");
  }

  return {
    source: "demo",
    invoice: createdInvoice,
    invoices: state.invoices,
    summary: state.summary,
    persistedInvoices: nextPersistedInvoices,
    syncedTransactions:
      synced.transactions !== transactionState.transactions ? synced.transactions : undefined,
  };
}

export async function updateInvoice(
  viewer: ViewerContext,
  invoiceId: string,
  input: InvoiceInput,
): Promise<InvoiceMutationResult | null> {
  const parsedInput = invoiceInputSchema.parse(input);
  const databaseResult = await updateDatabaseInvoice(viewer, invoiceId, parsedInput);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const persistedInvoices = await readDemoInvoices(onboardingState.profileType);
  const existingInvoice = persistedInvoices.find((invoice) => invoice.id === invoiceId);

  if (!existingInvoice) {
    return null;
  }

  validateUniqueInvoiceNumber(persistedInvoices, parsedInput.invoiceNumber, invoiceId);

  const nextPersistedInvoices = persistedInvoices.map((invoice) =>
    invoice.id === invoiceId
      ? invoiceCookieEntrySchema.parse({
          ...invoice,
          ...parsedInput,
          updatedAt: new Date().toISOString(),
        })
      : invoice,
  );
  const updatedEntry = nextPersistedInvoices.find((invoice) => invoice.id === invoiceId);

  if (!updatedEntry) {
    return null;
  }

  const draftInvoice = buildInvoiceRecord(updatedEntry, transactionState.transactions);
  const synced = await syncInvoicePaymentTransaction(
    viewer,
    draftInvoice,
    transactionState.transactions,
    transactionState.categories,
  );
  const invoices = nextPersistedInvoices.map((invoice) =>
    buildInvoiceRecord(invoice, synced.transactions),
  );
  const state = buildWorkspaceState(invoices, "demo");
  const updatedInvoice = state.invoices.find((invoice) => invoice.id === invoiceId);

  if (!updatedInvoice) {
    return null;
  }

  return {
    source: "demo",
    invoice: updatedInvoice,
    invoices: state.invoices,
    summary: state.summary,
    persistedInvoices: nextPersistedInvoices,
    syncedTransactions:
      synced.transactions !== transactionState.transactions ? synced.transactions : undefined,
  };
}

export async function deleteInvoice(
  viewer: ViewerContext,
  invoiceId: string,
): Promise<InvoiceDeleteResult | null> {
  const databaseResult = await deleteDatabaseInvoice(viewer, invoiceId);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const persistedInvoices = await readDemoInvoices(onboardingState.profileType);
  const existingInvoice = persistedInvoices.find((invoice) => invoice.id === invoiceId);

  if (!existingInvoice) {
    return null;
  }

  let syncedTransactions: TransactionRecord[] | undefined;
  const linkedIncomeTransaction = findLinkedInvoiceIncomeTransaction(
    invoiceId,
    transactionState.transactions,
  );

  if (linkedIncomeTransaction) {
    const deletedTransactionState = await deleteTransaction(viewer, linkedIncomeTransaction.id);
    syncedTransactions = deletedTransactionState?.transactions;
  }

  const nextPersistedInvoices = persistedInvoices.filter((invoice) => invoice.id !== invoiceId);
  const invoices = nextPersistedInvoices.map((invoice) =>
    buildInvoiceRecord(invoice, syncedTransactions ?? transactionState.transactions),
  );
  const state = buildWorkspaceState(invoices, "demo");

  return {
    ...state,
    persistedInvoices: nextPersistedInvoices,
    syncedTransactions,
  };
}

export function getSerializedInvoicesCookie(invoices: InvoiceCookieEntry[]) {
  return serializeInvoicesCookie(invoices);
}

export function createInvoiceDraftDefaults(existingInvoices: InvoiceRecord[]) {
  return invoiceInputSchema.parse({
    businessProfileId: undefined,
    invoiceNumber: createDefaultInvoiceNumber(existingInvoices),
    customerName: "",
    customerEmail: "",
    customerGstin: "",
    issueDate: getDefaultInvoiceDate(),
    dueDate: getDefaultInvoiceDueDate(),
    currency: "INR",
    status: "draft",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
      },
    ],
  });
}
