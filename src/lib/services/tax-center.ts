import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getDocumentWorkspaceState } from "@/lib/services/documents";
import { getInvoiceWorkspaceState } from "@/lib/services/invoices";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import { taxWorkspaceStateSchema } from "@/lib/validations/finance";
import type {
  DocumentRecord,
  InvoiceRecord,
  TaxChecklistItem,
  TaxNotesInput,
  TaxPeriod,
  TaxWorkspaceState,
  TransactionRecord,
} from "@/types/finance";

export const taxNotesCookieName = "afm-tax-notes";

const taxNotesCookieEntrySchema = z.object({
  notes: z.string().max(2000).default(""),
  updatedAt: z.string().min(1),
});

type TaxNotesCookieEntry = z.infer<typeof taxNotesCookieEntrySchema>;

type TaxNotesMutationResult = TaxWorkspaceState & {
  persistedNotes: TaxNotesCookieEntry;
};

function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function getPeriodBounds(period: TaxPeriod) {
  const today = getTodayStart();

  if (period === "quarter_to_date") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;

    return {
      periodStart: formatDateString(new Date(today.getFullYear(), quarterStartMonth, 1)),
      periodEnd: formatDateString(today),
    };
  }

  if (period === "year_to_date") {
    return {
      periodStart: formatDateString(new Date(today.getFullYear(), 0, 1)),
      periodEnd: formatDateString(today),
    };
  }

  return {
    periodStart: formatDateString(new Date(today.getFullYear(), today.getMonth(), 1)),
    periodEnd: formatDateString(today),
  };
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : "";
}

function inDateRange(value: string, periodStart: string, periodEnd: string) {
  return value >= periodStart && value <= periodEnd;
}

function extractDocumentTaxAmount(document: DocumentRecord) {
  const rawValue =
    document.extractedData && typeof document.extractedData === "object"
      ? (document.extractedData as Record<string, unknown>).taxAmount
      : undefined;
  const amount =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string"
        ? Number(rawValue)
        : 0;

  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function getTaxReserveAmount(transactions: TransactionRecord[]) {
  return transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      const haystack = [
        transaction.categoryLabel,
        transaction.title,
        transaction.notes,
        transaction.description,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes("tax") || haystack.includes("gst") || haystack.includes("filing");
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function buildChecklist(params: {
  profileType: TaxWorkspaceState["profileType"];
  gstin: string;
  invoiceCount: number;
  invoicesWithGstin: number;
  overdueInvoiceCount: number;
  taxDocumentCount: number;
  receiptReviewCount: number;
  pendingTransactionCount: number;
  uncategorizedCount: number;
}) {
  const items: TaxChecklistItem[] = [];

  if (params.profileType === "personal") {
    items.push({
      id: "gst-registration",
      title: "GST registration",
      description: "Personal mode does not require a business GSTIN by default.",
      status: "complete",
      detail: "Switch to freelancer or business mode later if GST registration becomes relevant.",
      ctaLabel: "View settings",
      ctaHref: "/dashboard/settings",
    });
  } else if (params.gstin) {
    items.push({
      id: "gst-registration",
      title: "Workspace GSTIN is available",
      description: "Business identity is configured and ready for invoice and filing workflows.",
      status: "complete",
      detail: params.gstin,
      ctaLabel: "Review settings",
      ctaHref: "/dashboard/settings",
    });
  } else {
    items.push({
      id: "gst-registration",
      title: "GSTIN still needs to be configured",
      description: "Add the workspace GST number before relying on this view for accountant handoff.",
      status: "warning",
      detail: "The current workspace does not expose a GSTIN yet.",
      ctaLabel: "Open settings",
      ctaHref: "/dashboard/settings",
    });
  }

  if (!params.invoiceCount) {
    items.push({
      id: "invoice-coverage",
      title: "No invoices in the selected period",
      description: "The GST summary is lighter because no invoice activity landed inside the active tax window.",
      status: "attention",
      detail: "Generate or sync invoices to get a fuller output-tax picture.",
      ctaLabel: "Open invoices",
      ctaHref: "/dashboard/invoices",
    });
  } else if (params.invoicesWithGstin === params.invoiceCount) {
    items.push({
      id: "invoice-coverage",
      title: "Invoice GSTIN coverage is complete",
      description: "Every invoice in the selected period carries customer GST context where applicable.",
      status: "complete",
      detail: `${params.invoicesWithGstin} of ${params.invoiceCount} invoices include GST details.`,
      ctaLabel: "Review invoices",
      ctaHref: "/dashboard/invoices",
    });
  } else {
    items.push({
      id: "invoice-coverage",
      title: "Invoice GST coverage needs cleanup",
      description: "Some invoices are still missing GST context, which weakens filing readiness and accountant handoff quality.",
      status: params.invoicesWithGstin > 0 ? "attention" : "warning",
      detail: `${params.invoicesWithGstin} of ${params.invoiceCount} invoices include GST details.`,
      ctaLabel: "Update invoices",
      ctaHref: "/dashboard/invoices",
    });
  }

  items.push({
    id: "tax-documents",
    title:
      params.taxDocumentCount > 0
        ? "Supporting tax documents are present"
        : "Supporting tax documents are still missing",
    description:
      params.taxDocumentCount > 0
        ? "Tax docs are available for review and accountant collaboration."
        : "Upload GST worksheets, challans, or filing notes before month-end review.",
    status: params.taxDocumentCount > 0 ? "complete" : "warning",
    detail:
      params.taxDocumentCount > 0
        ? `${params.taxDocumentCount} tax document${params.taxDocumentCount === 1 ? "" : "s"} detected.`
        : "No tax-specific document is available in the current workspace yet.",
    ctaLabel: "Open documents",
    ctaHref: "/dashboard/documents",
  });

  items.push({
    id: "receipt-review",
    title:
      params.receiptReviewCount > 0
        ? "Receipt review queue still needs attention"
        : "Receipt review queue is clear",
    description:
      params.receiptReviewCount > 0
        ? "Pending receipt reviews can hide input-tax evidence and weaken confidence in tax estimates."
        : "Receipt and bill review is not blocking tax prep right now.",
    status: params.receiptReviewCount > 0 ? "attention" : "complete",
    detail:
      params.receiptReviewCount > 0
        ? `${params.receiptReviewCount} receipt or bill item${params.receiptReviewCount === 1 ? "" : "s"} still needs review.`
        : "No review backlog is visible in receipt or bill documents.",
    ctaLabel: "Review receipts",
    ctaHref: "/dashboard/receipts",
  });

  const ledgerIssues = params.pendingTransactionCount + params.uncategorizedCount;

  items.push({
    id: "ledger-hygiene",
    title:
      ledgerIssues > 0
        ? "Ledger hygiene still needs cleanup"
        : "Ledger hygiene is good for tax reporting",
    description:
      ledgerIssues > 0
        ? "Pending and uncategorized records reduce the reliability of tax-ready exports and summaries."
        : "Pending and uncategorized records are not dragging down tax confidence right now.",
    status:
      ledgerIssues === 0 ? "complete" : ledgerIssues <= 3 ? "attention" : "warning",
    detail: `${params.pendingTransactionCount} pending and ${params.uncategorizedCount} uncategorized transaction${ledgerIssues === 1 ? "" : "s"} in the active period.`,
    ctaLabel: "Open transactions",
    ctaHref: "/dashboard/transactions",
  });

  items.push({
    id: "collections-followup",
    title:
      params.overdueInvoiceCount > 0
        ? "Collections follow-up is still needed"
        : "Collections posture looks stable",
    description:
      params.overdueInvoiceCount > 0
        ? "Overdue invoices can complicate cash planning around the next filing cycle."
        : "There are no overdue invoices dragging collections quality right now.",
    status: params.overdueInvoiceCount > 0 ? "warning" : "complete",
    detail:
      params.overdueInvoiceCount > 0
        ? `${params.overdueInvoiceCount} overdue invoice${params.overdueInvoiceCount === 1 ? "" : "s"} should be reviewed.`
        : "No overdue invoices detected in the active period.",
    ctaLabel: "Review invoices",
    ctaHref: "/dashboard/invoices",
  });

  return items;
}

function buildReadinessScore(checklist: TaxChecklistItem[]) {
  if (!checklist.length) {
    return 0;
  }

  const total = checklist.reduce((sum, item) => {
    if (item.status === "complete") {
      return sum + 100;
    }

    if (item.status === "attention") {
      return sum + 60;
    }

    return sum + 25;
  }, 0);

  return Math.round(total / checklist.length);
}

async function getDatabaseGstin(viewer: ViewerContext) {
  if (!appEnv.hasDatabase || !viewer.isSignedIn || !viewer.email) {
    return "";
  }

  try {
    const prisma = getPrismaClient();

    if (!prisma) {
      return "";
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

    return normalizeOptionalText(user?.businessProfiles[0]?.gstin);
  } catch {
    return "";
  }
}

async function readTaxNotes() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(taxNotesCookieName)?.value;

  if (!rawValue) {
    return {
      notes: "",
      updatedAt: "",
    };
  }

  try {
    const parsed = taxNotesCookieEntrySchema.parse(JSON.parse(rawValue));

    return {
      notes: parsed.notes,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return {
      notes: "",
      updatedAt: "",
    };
  }
}

export function getTaxNotesCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getTaxWorkspaceState(
  viewer: ViewerContext,
  period: TaxPeriod = "this_month",
): Promise<TaxWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const invoiceState = await getInvoiceWorkspaceState(viewer);
  const documentState = await getDocumentWorkspaceState(viewer);
  const gstin = await getDatabaseGstin(viewer);
  const notesState = await readTaxNotes();
  const { periodStart, periodEnd } = getPeriodBounds(period);
  const scopedTransactions = transactionState.transactions.filter((transaction) =>
    inDateRange(transaction.transactionDate, periodStart, periodEnd),
  );
  const scopedInvoices = invoiceState.invoices.filter((invoice) =>
    inDateRange(invoice.issueDate, periodStart, periodEnd),
  );
  const scopedDocuments = documentState.documents.filter((document) =>
    inDateRange(document.createdAt.slice(0, 10), periodStart, periodEnd),
  );
  const taxDocuments = scopedDocuments.filter((document) => document.kind === "tax_doc");
  const receiptReviewItems = scopedDocuments.filter(
    (document) =>
      (document.kind === "receipt" || document.kind === "bill") &&
      (document.status === "review" || document.status === "failed" || document.status === "processing"),
  );
  const outputTax = scopedInvoices.reduce((sum, invoice) => sum + invoice.taxAmount, 0);
  const taxableSales = scopedInvoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
  const paidCollections = scopedInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const estimatedInputTax = scopedDocuments
    .filter((document) => document.kind === "receipt" || document.kind === "bill")
    .reduce((sum, document) => sum + extractDocumentTaxAmount(document), 0);
  const taxReserveAmount = getTaxReserveAmount(scopedTransactions);
  const breakdown = {
    invoiceCount: scopedInvoices.length,
    invoicesWithGstin: scopedInvoices.filter((invoice) => Boolean(invoice.customerGstin)).length,
    overdueInvoiceCount: scopedInvoices.filter((invoice) => invoice.status === "overdue").length,
    draftInvoiceCount: scopedInvoices.filter((invoice) => invoice.status === "draft").length,
    paidInvoiceCount: scopedInvoices.filter((invoice) => invoice.status === "paid").length,
    taxDocumentCount: taxDocuments.length,
    receiptReviewCount: receiptReviewItems.length,
    pendingTransactionCount: scopedTransactions.filter((transaction) => transaction.status === "pending").length,
    uncategorizedCount: scopedTransactions.filter(
      (transaction) => transaction.type !== "transfer" && !transaction.categoryId,
    ).length,
  };
  const checklist = buildChecklist({
    profileType: onboardingState.profileType,
    gstin,
    invoiceCount: breakdown.invoiceCount,
    invoicesWithGstin: breakdown.invoicesWithGstin,
    overdueInvoiceCount: breakdown.overdueInvoiceCount,
    taxDocumentCount: breakdown.taxDocumentCount,
    receiptReviewCount: breakdown.receiptReviewCount,
    pendingTransactionCount: breakdown.pendingTransactionCount,
    uncategorizedCount: breakdown.uncategorizedCount,
  });
  const readinessScore = buildReadinessScore(checklist);

  return taxWorkspaceStateSchema.parse({
    period,
    periodStart,
    periodEnd,
    workspaceName: onboardingState.workspaceName || viewer.name || "Finance workspace",
    profileType: onboardingState.profileType,
    gstin,
    summary: {
      outputTax,
      estimatedInputTax,
      netTaxPosition: outputTax - estimatedInputTax,
      taxableSales,
      paidCollections,
      taxReserveAmount,
      readinessScore,
    },
    breakdown,
    checklist,
    invoiceHighlights: scopedInvoices
      .slice()
      .sort((left, right) => right.issueDate.localeCompare(left.issueDate))
      .slice(0, 4)
      .map((invoice: InvoiceRecord) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerGstin: invoice.customerGstin,
        issueDate: invoice.issueDate,
        totalAmount: invoice.totalAmount,
        taxAmount: invoice.taxAmount,
        status: invoice.status,
      })),
    documentHighlights: scopedDocuments
      .filter((document) => document.kind === "tax_doc" || document.kind === "receipt" || document.kind === "bill")
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((document: DocumentRecord) => ({
        id: document.id,
        originalName: document.originalName,
        kind: document.kind,
        status: document.status,
        createdAt: document.createdAt,
        aiSummary: document.aiSummary,
      })),
    notes: notesState.notes,
    noteUpdatedAt: notesState.updatedAt,
    source:
      transactionState.source === "database" ||
      invoiceState.source === "database" ||
      documentState.source === "database"
        ? "database"
        : "demo",
  });
}

export async function updateTaxWorkspaceNotes(
  viewer: ViewerContext,
  input: TaxNotesInput,
): Promise<TaxNotesMutationResult> {
  const persistedNotes = taxNotesCookieEntrySchema.parse({
    notes: input.notes,
    updatedAt: new Date().toISOString(),
  });
  const workspaceState = await getTaxWorkspaceState(viewer, input.period ?? "this_month");

  return {
    ...workspaceState,
    notes: persistedNotes.notes,
    noteUpdatedAt: persistedNotes.updatedAt,
    persistedNotes,
  };
}

export function getSerializedTaxNotesCookie(notes: TaxNotesCookieEntry) {
  return JSON.stringify(taxNotesCookieEntrySchema.parse(notes));
}
