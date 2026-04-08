import "server-only";

import {
  CategoryKind,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { cookies } from "next/headers";

import {
  applyTransactionFilters,
  summarizeTransactions,
} from "@/features/transactions/transaction-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { defaultCategoryTemplates } from "@/lib/db/seed-data";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import {
  createTransactionRules,
  findMatchingTransactionRule,
  getTransactionRules,
} from "@/lib/services/transaction-rules";
import {
  categorizationApplyItemSchema,
  transactionFiltersSchema,
  transactionInputSchema,
  transactionRecordSchema,
} from "@/lib/validations/finance";
import type {
  CategorizationApplyItem,
  TransactionCategoryOption,
  TransactionFilters,
  TransactionInput,
  TransactionRecord,
  TransactionRuleRecord,
  TransactionSummary,
  TransactionWorkspaceState,
} from "@/types/finance";

export const transactionCookieName = "afm-transactions";

const demoCategoryIdBySlug = {
  salary: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68001",
  retainers: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68002",
  investments: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68003",
  housing: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68004",
  food: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68005",
  software: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68006",
  tax: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68007",
  travel: "1e0b2b9c-8b6d-4d62-8c22-b3eb00d68008",
} satisfies Record<(typeof defaultCategoryTemplates)[number]["slug"], string>;

const demoTransactionSeedMap = {
  personal: [
    {
      id: "5a4ae124-aefb-4d6a-9fb8-fadbc6fb3401",
      title: "Salary credit",
      type: "income",
      categorySlug: "salary",
      amount: 92000,
      status: "cleared",
      merchantName: "Primary employer",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 2,
      notes: "Net salary settled for the current month.",
    },
    {
      id: "5a4ae124-aefb-4d6a-9fb8-fadbc6fb3402",
      title: "Weekly groceries",
      type: "expense",
      categorySlug: "food",
      amount: 3480,
      status: "cleared",
      merchantName: "Nature's Basket",
      paymentMethod: "UPI",
      recurring: false,
      daysAgo: 1,
      notes: "Weekend household stock-up.",
    },
    {
      id: "5a4ae124-aefb-4d6a-9fb8-fadbc6fb3403",
      title: "Emergency fund transfer",
      type: "transfer",
      categorySlug: "housing",
      amount: 12000,
      status: "pending",
      merchantName: "Savings account",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 4,
      notes: "Waiting for auto-sweep confirmation.",
    },
    {
      id: "5a4ae124-aefb-4d6a-9fb8-fadbc6fb3404",
      title: "Streaming and software bundle",
      type: "expense",
      categorySlug: "software",
      amount: 1599,
      status: "cleared",
      merchantName: "Digital renewals",
      paymentMethod: "Card",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 6,
      notes: "Recurring entertainment and utility tools.",
    },
    {
      id: "5a4ae124-aefb-4d6a-9fb8-fadbc6fb3405",
      title: "Mutual fund dividend",
      type: "income",
      categorySlug: "investments",
      amount: 4200,
      status: "cleared",
      merchantName: "Investment account",
      paymentMethod: "Bank transfer",
      recurring: false,
      daysAgo: 9,
      notes: "Auto-credited from long-term holding.",
    },
  ],
  freelancer: [
    {
      id: "6b5be235-bf0c-4e7b-afc9-fbecd7fc4501",
      title: "Nova Labs retainer",
      type: "income",
      categorySlug: "retainers",
      amount: 58000,
      status: "cleared",
      merchantName: "Nova Labs",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 2,
      notes: "March retainer cleared with no follow-up required.",
    },
    {
      id: "6b5be235-bf0c-4e7b-afc9-fbecd7fc4502",
      title: "Design workshop invoice",
      type: "income",
      categorySlug: "retainers",
      amount: 22500,
      status: "pending",
      merchantName: "Indigo Workshop",
      paymentMethod: "Invoice transfer",
      recurring: false,
      daysAgo: 5,
      notes: "Follow up with the client if unpaid after Friday.",
    },
    {
      id: "6b5be235-bf0c-4e7b-afc9-fbecd7fc4503",
      title: "Figma and product stack",
      type: "expense",
      categorySlug: "software",
      amount: 4299,
      status: "cleared",
      merchantName: "Figma",
      paymentMethod: "Card",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 3,
      notes: "Core SaaS tools across design and project delivery.",
    },
    {
      id: "6b5be235-bf0c-4e7b-afc9-fbecd7fc4504",
      title: "Client travel reimbursement",
      type: "expense",
      categorySlug: "travel",
      amount: 6240,
      status: "pending",
      merchantName: "Uber Intercity",
      paymentMethod: "UPI",
      recurring: false,
      daysAgo: 7,
      notes: "Pending reimbursement tagging before month-end close.",
    },
    {
      id: "6b5be235-bf0c-4e7b-afc9-fbecd7fc4505",
      title: "GST reserve transfer",
      type: "expense",
      categorySlug: "tax",
      amount: 14000,
      status: "cleared",
      merchantName: "Tax reserve",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 10,
      notes: "Held aside to reduce tax filing surprises later.",
    },
  ],
  business: [
    {
      id: "7c6cf346-c01d-4f8c-b0da-0cfd8d0d5601",
      title: "Enterprise services retainer",
      type: "income",
      categorySlug: "retainers",
      amount: 184000,
      status: "cleared",
      merchantName: "Aster Retail",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 1,
      notes: "Primary recurring contract credited this cycle.",
    },
    {
      id: "7c6cf346-c01d-4f8c-b0da-0cfd8d0d5602",
      title: "Quarterly partner payout",
      type: "income",
      categorySlug: "investments",
      amount: 96000,
      status: "pending",
      merchantName: "Channel partner",
      paymentMethod: "Wire transfer",
      recurring: false,
      daysAgo: 4,
      notes: "Awaiting remittance confirmation from the partner team.",
    },
    {
      id: "7c6cf346-c01d-4f8c-b0da-0cfd8d0d5603",
      title: "Software operations stack",
      type: "expense",
      categorySlug: "software",
      amount: 21800,
      status: "cleared",
      merchantName: "Ops stack",
      paymentMethod: "Corporate card",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 2,
      notes: "Shared finance, CRM, and reporting tooling renewal.",
    },
    {
      id: "7c6cf346-c01d-4f8c-b0da-0cfd8d0d5604",
      title: "Compliance travel",
      type: "expense",
      categorySlug: "travel",
      amount: 15400,
      status: "pending",
      merchantName: "Business travel desk",
      paymentMethod: "Bank transfer",
      recurring: false,
      daysAgo: 6,
      notes: "Needs final travel docs before close.",
    },
    {
      id: "7c6cf346-c01d-4f8c-b0da-0cfd8d0d5605",
      title: "GST and advance tax reserve",
      type: "expense",
      categorySlug: "tax",
      amount: 47200,
      status: "cleared",
      merchantName: "Finance reserve",
      paymentMethod: "Bank transfer",
      recurring: true,
      recurringInterval: "monthly",
      daysAgo: 8,
      notes: "Protected compliance cash bucket for the current cycle.",
    },
  ],
} as const;

type TransactionMutationResult = {
  source: TransactionWorkspaceState["source"];
  transaction: TransactionRecord;
  transactions: TransactionRecord[];
  categories: TransactionCategoryOption[];
  rules: TransactionRuleRecord[];
  summary: TransactionSummary;
};

export type CategorizationApplyResult = {
  source: TransactionWorkspaceState["source"];
  transactions: TransactionRecord[];
  categories: TransactionCategoryOption[];
  rules: TransactionRuleRecord[];
  summary: TransactionSummary;
  updatedTransactions: TransactionRecord[];
};

type ResolvedTransactionInput = TransactionInput & {
  aiCategoryConfidence?: number;
  aiCategorySummary?: string;
};

function mapCategoryKind(kind: CategoryKind): TransactionCategoryOption["kind"] {
  return kind === CategoryKind.INCOME ? "income" : "expense";
}

function mapTransactionType(type: TransactionType): TransactionRecord["type"] {
  if (type === TransactionType.INCOME) {
    return "income";
  }

  if (type === TransactionType.EXPENSE) {
    return "expense";
  }

  return "transfer";
}

function mapTransactionSource(source: TransactionSource): TransactionRecord["source"] {
  if (source === TransactionSource.RECEIPT) {
    return "receipt";
  }

  if (source === TransactionSource.INVOICE) {
    return "invoice";
  }

  if (source === TransactionSource.AI) {
    return "ai";
  }

  return "manual";
}

function mapTransactionStatus(status: TransactionStatus): TransactionRecord["status"] {
  return status === TransactionStatus.CLEARED ? "cleared" : "pending";
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : "";
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRelativeDate(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);

  return formatLocalDate(value);
}

function getRelativeDateTime(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  value.setHours(10, 30, 0, 0);

  return value.toISOString();
}

function getDemoCategories(): TransactionCategoryOption[] {
  return defaultCategoryTemplates.map((template) => ({
    id: demoCategoryIdBySlug[template.slug],
    label: template.name,
    slug: template.slug,
    kind: template.kind,
    icon: template.icon,
    color: template.color,
  }));
}

function findCategoryById(categories: TransactionCategoryOption[], categoryId?: string) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

function toTransactionRecord(
  input: {
    id: string;
    businessProfileId?: string | null;
    categoryId?: string | null;
    categoryLabel?: string | null;
    type: TransactionRecord["type"];
    source: TransactionRecord["source"];
    title: string;
    description?: string | null;
    merchantName?: string | null;
    amount: number;
    currency: string;
    transactionDate: string;
    paymentMethod?: string | null;
    status: TransactionRecord["status"];
    recurring: boolean;
    recurringInterval?: string | null;
    aiCategoryConfidence?: number | null;
    aiCategorySummary?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  },
) {
  return transactionRecordSchema.parse({
    id: input.id,
    businessProfileId: input.businessProfileId ?? undefined,
    categoryId: input.categoryId ?? undefined,
    categoryLabel: input.categoryLabel ?? "Uncategorized",
    type: input.type,
    source: input.source,
    title: input.title,
    description: normalizeOptionalText(input.description),
    merchantName: normalizeOptionalText(input.merchantName),
    amount: input.amount,
    currency: input.currency,
    transactionDate: input.transactionDate,
    paymentMethod: normalizeOptionalText(input.paymentMethod),
    status: input.status,
    recurring: input.recurring,
    recurringInterval: normalizeOptionalText(input.recurringInterval),
    aiCategoryConfidence: input.aiCategoryConfidence ?? undefined,
    aiCategorySummary: normalizeOptionalText(input.aiCategorySummary),
    notes: normalizeOptionalText(input.notes),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function buildDemoTransactions(
  profileType: "personal" | "freelancer" | "business",
  categories: TransactionCategoryOption[],
) {
  return demoTransactionSeedMap[profileType].map((seed) => {
    const category = categories.find((item) => item.slug === seed.categorySlug) ?? null;

    return toTransactionRecord({
      id: seed.id,
      businessProfileId: undefined,
      categoryId: category?.id,
      categoryLabel: category?.label ?? "Uncategorized",
      type: seed.type,
      source: "manual",
      title: seed.title,
      description: "",
      merchantName: seed.merchantName,
      amount: seed.amount,
      currency: "INR",
      transactionDate: getRelativeDate(seed.daysAgo),
      paymentMethod: seed.paymentMethod,
      status: seed.status,
      recurring: seed.recurring,
      recurringInterval: "recurringInterval" in seed ? seed.recurringInterval ?? "" : "",
      notes: seed.notes,
      createdAt: getRelativeDateTime(seed.daysAgo),
      updatedAt: getRelativeDateTime(seed.daysAgo),
    });
  });
}

async function readDemoTransactions(profileType: "personal" | "freelancer" | "business") {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(transactionCookieName)?.value;

  if (!rawValue) {
    return buildDemoTransactions(profileType, getDemoCategories());
  }

  try {
    return transactionRecordSchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoTransactions(profileType, getDemoCategories());
  }
}

function serializeTransactionsCookie(transactions: TransactionRecord[]) {
  return JSON.stringify(transactionRecordSchema.array().parse(transactions));
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

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });

    return {
      prisma,
      userId: user.id,
      categories:
        categories.map((category) => ({
          id: category.id,
          label: category.name,
          slug: category.slug,
          kind: mapCategoryKind(category.kind),
          icon: category.icon ?? undefined,
          color: category.color ?? undefined,
        })) || [],
    };
  } catch {
    return null;
  }
}

async function readDatabaseTransactions(
  viewer: ViewerContext,
  fallbackCategories: TransactionCategoryOption[],
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const transactions = await context.prisma.transaction.findMany({
    where: { userId: context.userId },
    include: { category: true },
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
  });

  const categories = context.categories.length ? context.categories : fallbackCategories;

  return {
    source: "database" as const,
    categories,
    transactions: transactions.map((transaction) =>
      toTransactionRecord({
        id: transaction.id,
        businessProfileId: transaction.businessProfileId ?? undefined,
        categoryId: transaction.categoryId ?? undefined,
        categoryLabel: transaction.category?.name ?? "Uncategorized",
        type: mapTransactionType(transaction.type),
        source: mapTransactionSource(transaction.source),
        title: transaction.title,
        description: transaction.description,
        merchantName: transaction.merchantName,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        transactionDate: formatLocalDate(transaction.transactionDate),
        paymentMethod: transaction.paymentMethod,
        status: mapTransactionStatus(transaction.status),
        recurring: transaction.recurring,
        recurringInterval: transaction.recurringInterval,
        aiCategoryConfidence:
          transaction.aiCategoryConfidence === null
            ? undefined
            : Number(transaction.aiCategoryConfidence),
        aiCategorySummary: transaction.aiCategorySummary ?? undefined,
        notes: transaction.notes,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      }),
    ),
  };
}

async function getTransactionBaseState(viewer: ViewerContext): Promise<TransactionWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const demoCategories = getDemoCategories();
  const databaseState = await readDatabaseTransactions(viewer, demoCategories);
  const rules = await getTransactionRules(viewer);

  if (databaseState) {
    return {
      transactions: databaseState.transactions,
      categories: databaseState.categories,
      summary: summarizeTransactions(databaseState.transactions),
      rules,
      source: "database",
    };
  }

  const demoTransactions = await readDemoTransactions(onboardingState.profileType);

  return {
    transactions: demoTransactions,
    categories: demoCategories,
    summary: summarizeTransactions(demoTransactions),
    rules,
    source: "demo",
  };
}

function createDemoTransactionRecord(
  input: ResolvedTransactionInput,
  categories: TransactionCategoryOption[],
) {
  const now = new Date().toISOString();
  const category = findCategoryById(categories, input.categoryId);

  return toTransactionRecord({
    id: crypto.randomUUID(),
    businessProfileId: input.businessProfileId,
    categoryId: input.categoryId,
    categoryLabel: category?.label ?? "Uncategorized",
    type: input.type,
    source: input.source,
    title: input.title,
    description: input.description,
    merchantName: input.merchantName,
    amount: input.amount,
    currency: input.currency,
    transactionDate: input.transactionDate,
    paymentMethod: input.paymentMethod,
    status: input.status,
    recurring: input.recurring,
    recurringInterval: input.recurringInterval,
    aiCategoryConfidence: input.aiCategoryConfidence,
    aiCategorySummary: input.aiCategorySummary,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  });
}

async function createDatabaseTransaction(
  input: ResolvedTransactionInput,
  viewer: ViewerContext,
  fallbackCategories: TransactionCategoryOption[],
): Promise<TransactionMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.transaction.create({
    data: {
      userId: context.userId,
      businessProfileId: input.businessProfileId || undefined,
      categoryId: input.categoryId || undefined,
      type:
        input.type === "income"
          ? TransactionType.INCOME
          : input.type === "expense"
            ? TransactionType.EXPENSE
            : TransactionType.TRANSFER,
      source:
        input.source === "receipt"
          ? TransactionSource.RECEIPT
          : input.source === "invoice"
            ? TransactionSource.INVOICE
            : input.source === "ai"
              ? TransactionSource.AI
              : TransactionSource.MANUAL,
      title: input.title,
      description: normalizeOptionalText(input.description) || undefined,
      merchantName: normalizeOptionalText(input.merchantName) || undefined,
      amount: input.amount,
      currency: input.currency,
      transactionDate: new Date(`${input.transactionDate}T00:00:00.000Z`),
      paymentMethod: normalizeOptionalText(input.paymentMethod) || undefined,
      status: input.status === "cleared" ? TransactionStatus.CLEARED : TransactionStatus.PENDING,
      recurring: input.recurring,
      recurringInterval: normalizeOptionalText(input.recurringInterval) || undefined,
      aiCategoryConfidence: input.aiCategoryConfidence,
      aiCategorySummary: normalizeOptionalText(input.aiCategorySummary) || undefined,
      notes: normalizeOptionalText(input.notes) || undefined,
    },
    include: { category: true },
  });

  const baseState = await getTransactionBaseState(viewer);
  const transaction =
    baseState.transactions.find((candidate) => candidate.id === created.id) ??
    toTransactionRecord({
      id: created.id,
      businessProfileId: created.businessProfileId ?? undefined,
      categoryId: created.categoryId ?? undefined,
      categoryLabel: created.category?.name ?? "Uncategorized",
      type: mapTransactionType(created.type),
      source: mapTransactionSource(created.source),
      title: created.title,
      description: created.description,
      merchantName: created.merchantName,
      amount: Number(created.amount),
      currency: created.currency,
      transactionDate: formatLocalDate(created.transactionDate),
      paymentMethod: created.paymentMethod,
      status: mapTransactionStatus(created.status),
      recurring: created.recurring,
      recurringInterval: created.recurringInterval,
      aiCategoryConfidence:
        created.aiCategoryConfidence === null ? undefined : Number(created.aiCategoryConfidence),
      aiCategorySummary: created.aiCategorySummary ?? undefined,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });

  return {
    source: "database",
    transaction,
    transactions: baseState.transactions,
    categories: baseState.categories.length ? baseState.categories : fallbackCategories,
    rules: baseState.rules,
    summary: baseState.summary,
  };
}

async function updateDatabaseTransaction(
  transactionId: string,
  input: ResolvedTransactionInput,
  viewer: ViewerContext,
  fallbackCategories: TransactionCategoryOption[],
): Promise<TransactionMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const updated = await context.prisma.transaction.update({
    where: { id: transactionId },
    data: {
      businessProfileId: input.businessProfileId || undefined,
      categoryId: input.categoryId || undefined,
      type:
        input.type === "income"
          ? TransactionType.INCOME
          : input.type === "expense"
            ? TransactionType.EXPENSE
            : TransactionType.TRANSFER,
      source:
        input.source === "receipt"
          ? TransactionSource.RECEIPT
          : input.source === "invoice"
            ? TransactionSource.INVOICE
            : input.source === "ai"
              ? TransactionSource.AI
              : TransactionSource.MANUAL,
      title: input.title,
      description: normalizeOptionalText(input.description) || undefined,
      merchantName: normalizeOptionalText(input.merchantName) || undefined,
      amount: input.amount,
      currency: input.currency,
      transactionDate: new Date(`${input.transactionDate}T00:00:00.000Z`),
      paymentMethod: normalizeOptionalText(input.paymentMethod) || undefined,
      status: input.status === "cleared" ? TransactionStatus.CLEARED : TransactionStatus.PENDING,
      recurring: input.recurring,
      recurringInterval: normalizeOptionalText(input.recurringInterval) || undefined,
      aiCategoryConfidence: input.aiCategoryConfidence,
      aiCategorySummary: normalizeOptionalText(input.aiCategorySummary) || undefined,
      notes: normalizeOptionalText(input.notes) || undefined,
    },
    include: { category: true },
  });

  const baseState = await getTransactionBaseState(viewer);
  const transaction =
    baseState.transactions.find((candidate) => candidate.id === updated.id) ??
    toTransactionRecord({
      id: updated.id,
      businessProfileId: updated.businessProfileId ?? undefined,
      categoryId: updated.categoryId ?? undefined,
      categoryLabel: updated.category?.name ?? "Uncategorized",
      type: mapTransactionType(updated.type),
      source: mapTransactionSource(updated.source),
      title: updated.title,
      description: updated.description,
      merchantName: updated.merchantName,
      amount: Number(updated.amount),
      currency: updated.currency,
      transactionDate: formatLocalDate(updated.transactionDate),
      paymentMethod: updated.paymentMethod,
      status: mapTransactionStatus(updated.status),
      recurring: updated.recurring,
      recurringInterval: updated.recurringInterval,
      aiCategoryConfidence:
        updated.aiCategoryConfidence === null ? undefined : Number(updated.aiCategoryConfidence),
      aiCategorySummary: updated.aiCategorySummary ?? undefined,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });

  return {
    source: "database",
    transaction,
    transactions: baseState.transactions,
    categories: baseState.categories.length ? baseState.categories : fallbackCategories,
    rules: baseState.rules,
    summary: baseState.summary,
  };
}

async function deleteDatabaseTransaction(transactionId: string, viewer: ViewerContext) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await context.prisma.transaction.delete({
    where: { id: transactionId },
  });

  return getTransactionBaseState(viewer);
}

async function applyMatchingRuleToTransactionInput(
  viewer: ViewerContext,
  input: TransactionInput,
): Promise<ResolvedTransactionInput> {
  if (input.type === "transfer" || input.categoryId) {
    return input satisfies ResolvedTransactionInput;
  }

  const matchingRule = await findMatchingTransactionRule(viewer, input);

  if (!matchingRule) {
    return input satisfies ResolvedTransactionInput;
  }

  return {
    ...input,
    categoryId: matchingRule.categoryId,
    aiCategoryConfidence: 0.99,
    aiCategorySummary: `Auto-categorized from saved ${matchingRule.matchField} rule.`,
  } satisfies ResolvedTransactionInput;
}

function buildAppliedCategorizationRecord(
  transaction: TransactionRecord,
  suggestion: CategorizationApplyItem,
  categories: TransactionCategoryOption[],
) {
  const category = findCategoryById(categories, suggestion.suggestedCategoryId);

  if (!category) {
    return transaction;
  }

  return toTransactionRecord({
    ...transaction,
    categoryId: suggestion.suggestedCategoryId,
    categoryLabel: category.label,
    aiCategoryConfidence: suggestion.confidence,
    aiCategorySummary: suggestion.reason,
    updatedAt: new Date().toISOString(),
  });
}

export function getTransactionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getTransactionWorkspaceState(
  viewer: ViewerContext,
  filterInput?: Partial<TransactionFilters>,
): Promise<TransactionWorkspaceState> {
  const baseState = await getTransactionBaseState(viewer);

  if (!filterInput) {
    return baseState;
  }

  const filters = transactionFiltersSchema.parse(filterInput);

  return {
    ...baseState,
    transactions: applyTransactionFilters(baseState.transactions, filters),
  };
}

export async function createTransaction(
  viewer: ViewerContext,
  input: TransactionInput,
): Promise<TransactionMutationResult> {
  const parsedInput = transactionInputSchema.parse(input);
  const resolvedInput = await applyMatchingRuleToTransactionInput(viewer, parsedInput);
  const baseState = await getTransactionBaseState(viewer);
  const databaseResult = await createDatabaseTransaction(
    resolvedInput,
    viewer,
    baseState.categories,
  );

  if (databaseResult) {
    return databaseResult;
  }

  const transaction = createDemoTransactionRecord(resolvedInput, baseState.categories);
  const transactions = [transaction, ...baseState.transactions];

  return {
    source: "demo",
    transaction,
    transactions,
    categories: baseState.categories,
    rules: baseState.rules,
    summary: summarizeTransactions(transactions),
  };
}

export async function updateTransaction(
  viewer: ViewerContext,
  transactionId: string,
  input: TransactionInput,
): Promise<TransactionMutationResult | null> {
  const parsedInput = transactionInputSchema.parse(input);
  const baseState = await getTransactionBaseState(viewer);
  const existingTransaction = baseState.transactions.find(
    (transaction) => transaction.id === transactionId,
  );

  if (!existingTransaction) {
    return null;
  }

  const resolvedInput = await applyMatchingRuleToTransactionInput(viewer, parsedInput);
  const categoryChanged = existingTransaction.categoryId !== resolvedInput.categoryId;
  const normalizedInput: ResolvedTransactionInput = {
    ...resolvedInput,
    aiCategoryConfidence: categoryChanged
      ? resolvedInput.aiCategoryConfidence
      : existingTransaction.aiCategoryConfidence,
    aiCategorySummary: categoryChanged
      ? resolvedInput.aiCategorySummary
      : existingTransaction.aiCategorySummary,
  };
  const databaseResult = await updateDatabaseTransaction(
    transactionId,
    normalizedInput,
    viewer,
    baseState.categories,
  );

  if (databaseResult) {
    return databaseResult;
  }

  const category = findCategoryById(baseState.categories, normalizedInput.categoryId);
  const transaction = toTransactionRecord({
    ...existingTransaction,
    ...normalizedInput,
    categoryId: normalizedInput.categoryId,
    categoryLabel: category?.label ?? "Uncategorized",
    aiCategoryConfidence: normalizedInput.aiCategoryConfidence,
    aiCategorySummary: normalizedInput.aiCategorySummary,
    updatedAt: new Date().toISOString(),
  });

  const transactions = baseState.transactions.map((item) =>
    item.id === transactionId ? transaction : item,
  );

  return {
    source: "demo",
    transaction,
    transactions,
    categories: baseState.categories,
    rules: baseState.rules,
    summary: summarizeTransactions(transactions),
  };
}

export async function deleteTransaction(viewer: ViewerContext, transactionId: string) {
  const databaseResult = await deleteDatabaseTransaction(transactionId, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const baseState = await getTransactionBaseState(viewer);
  const transactions = baseState.transactions.filter(
    (transaction) => transaction.id !== transactionId,
  );

  if (transactions.length === baseState.transactions.length) {
    return null;
  }

  return {
    ...baseState,
    transactions,
    summary: summarizeTransactions(transactions),
  };
}

export async function applyCategorizationSuggestions(
  viewer: ViewerContext,
  suggestions: CategorizationApplyItem[],
): Promise<CategorizationApplyResult | null> {
  const parsedSuggestions = categorizationApplyItemSchema.array().parse(suggestions);
  const baseState = await getTransactionBaseState(viewer);
  const suggestionIds = new Set(parsedSuggestions.map((suggestion) => suggestion.transactionId));
  const actionableSuggestions = parsedSuggestions.filter((suggestion) => {
    const transaction = baseState.transactions.find(
      (candidate) => candidate.id === suggestion.transactionId,
    );
    const category = findCategoryById(baseState.categories, suggestion.suggestedCategoryId);

    return Boolean(transaction && category);
  });

  if (!actionableSuggestions.length) {
    return null;
  }

  const databaseContext = await getDatabaseContext(viewer);
  const ruleInputs = actionableSuggestions
    .filter(
      (suggestion) =>
        suggestion.saveRule && suggestion.ruleMatchField && suggestion.ruleMatchValue,
    )
    .map((suggestion) => ({
      matchField: suggestion.ruleMatchField!,
      matchValue: suggestion.ruleMatchValue!,
      categoryId: suggestion.suggestedCategoryId,
      createdBy: "ai" as const,
    }));

  if (databaseContext) {
    for (const suggestion of actionableSuggestions) {
      await databaseContext.prisma.transaction.updateMany({
        where: {
          id: suggestion.transactionId,
          userId: databaseContext.userId,
        },
        data: {
          categoryId: suggestion.suggestedCategoryId,
          aiCategoryConfidence: suggestion.confidence,
          aiCategorySummary: suggestion.reason,
        },
      });
    }

    if (ruleInputs.length) {
      await createTransactionRules(viewer, ruleInputs, baseState.categories, baseState.rules);
    }

    const nextState = await getTransactionBaseState(viewer);

    return {
      source: "database",
      transactions: nextState.transactions,
      categories: nextState.categories,
      rules: nextState.rules,
      summary: nextState.summary,
      updatedTransactions: nextState.transactions.filter((transaction) =>
        suggestionIds.has(transaction.id),
      ),
    };
  }

  const suggestionMap = new Map(
    actionableSuggestions.map((suggestion) => [suggestion.transactionId, suggestion]),
  );
  const transactions = baseState.transactions.map((transaction) => {
    const suggestion = suggestionMap.get(transaction.id);

    return suggestion
      ? buildAppliedCategorizationRecord(transaction, suggestion, baseState.categories)
      : transaction;
  });
  const ruleMutation = ruleInputs.length
    ? await createTransactionRules(viewer, ruleInputs, baseState.categories, baseState.rules)
    : {
        source: "demo" as const,
        rules: baseState.rules,
        persistedRules: baseState.rules,
      };

  return {
    source: "demo",
    transactions,
    categories: baseState.categories,
    rules: ruleMutation.rules,
    summary: summarizeTransactions(transactions),
    updatedTransactions: transactions.filter((transaction) => suggestionIds.has(transaction.id)),
  };
}

export function getSerializedTransactionsCookie(transactions: TransactionRecord[]) {
  return serializeTransactionsCookie(transactions);
}
