import "server-only";

import { BudgetPeriod } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import { buildBudgetAlerts, buildBudgetSummary } from "@/features/budgets/budget-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";
import { budgetInputSchema, budgetRecordSchema } from "@/lib/validations/finance";
import type {
  BudgetInput,
  BudgetRecord,
  BudgetSummary,
  BudgetWorkspaceState,
  TransactionCategoryOption,
  TransactionRecord,
} from "@/types/finance";

export const budgetCookieName = "afm-budgets";

const budgetCookieEntrySchema = budgetInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

type BudgetCookieEntry = z.infer<typeof budgetCookieEntrySchema>;

type BudgetMutationResult = {
  source: BudgetWorkspaceState["source"];
  budget: BudgetRecord;
  budgets: BudgetRecord[];
  categories: TransactionCategoryOption[];
  summary: BudgetSummary;
  alerts: BudgetWorkspaceState["alerts"];
  persistedBudgets: BudgetCookieEntry[];
};

type DemoBudgetSeed = {
  id: string;
  name: string;
  categorySlug?: string;
  limitAmount: number;
  period: BudgetInput["period"];
  alertPercent: number;
  carryForward: boolean;
};

const demoBudgetSeedMap = {
  personal: [
    {
      id: "8d7df457-d12e-4f9d-b1eb-1dfd9e1d6701",
      name: "Housing baseline",
      categorySlug: "housing",
      limitAmount: 38000,
      period: "monthly",
      alertPercent: 85,
      carryForward: false,
    },
    {
      id: "8d7df457-d12e-4f9d-b1eb-1dfd9e1d6702",
      name: "Food and groceries",
      categorySlug: "food",
      limitAmount: 16000,
      period: "monthly",
      alertPercent: 80,
      carryForward: false,
    },
    {
      id: "8d7df457-d12e-4f9d-b1eb-1dfd9e1d6703",
      name: "Annual subscriptions",
      categorySlug: "software",
      limitAmount: 12000,
      period: "yearly",
      alertPercent: 70,
      carryForward: true,
    },
    {
      id: "8d7df457-d12e-4f9d-b1eb-1dfd9e1d6704",
      name: "Uncategorized cleanup",
      limitAmount: 5000,
      period: "monthly",
      alertPercent: 60,
      carryForward: false,
    },
  ],
  freelancer: [
    {
      id: "9e8ea568-e23f-40ae-c2fc-2e0ea02e7801",
      name: "Software stack",
      categorySlug: "software",
      limitAmount: 7000,
      period: "monthly",
      alertPercent: 75,
      carryForward: false,
    },
    {
      id: "9e8ea568-e23f-40ae-c2fc-2e0ea02e7802",
      name: "Travel and client ops",
      categorySlug: "travel",
      limitAmount: 10000,
      period: "monthly",
      alertPercent: 80,
      carryForward: false,
    },
    {
      id: "9e8ea568-e23f-40ae-c2fc-2e0ea02e7803",
      name: "GST reserve",
      categorySlug: "tax",
      limitAmount: 42000,
      period: "quarterly",
      alertPercent: 70,
      carryForward: true,
    },
    {
      id: "9e8ea568-e23f-40ae-c2fc-2e0ea02e7804",
      name: "Uncategorized audit",
      limitAmount: 8000,
      period: "monthly",
      alertPercent: 60,
      carryForward: false,
    },
  ],
  business: [
    {
      id: "af9fb679-f340-41bf-d30d-3f1fb13f8901",
      name: "Operations stack",
      categorySlug: "software",
      limitAmount: 50000,
      period: "monthly",
      alertPercent: 80,
      carryForward: false,
    },
    {
      id: "af9fb679-f340-41bf-d30d-3f1fb13f8902",
      name: "Compliance and tax reserve",
      categorySlug: "tax",
      limitAmount: 165000,
      period: "quarterly",
      alertPercent: 72,
      carryForward: true,
    },
    {
      id: "af9fb679-f340-41bf-d30d-3f1fb13f8903",
      name: "Travel and field operations",
      categorySlug: "travel",
      limitAmount: 42000,
      period: "quarterly",
      alertPercent: 78,
      carryForward: false,
    },
    {
      id: "af9fb679-f340-41bf-d30d-3f1fb13f8904",
      name: "Uncategorized finance review",
      limitAmount: 15000,
      period: "monthly",
      alertPercent: 65,
      carryForward: false,
    },
  ],
} satisfies Record<"personal" | "freelancer" | "business", DemoBudgetSeed[]>;

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayStart() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);

  return value;
}

function getPeriodRange(period: BudgetInput["period"]) {
  const today = getTodayStart();

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
    const endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0);

    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
    };
  }

  if (period === "yearly") {
    const startDate = new Date(today.getFullYear(), 0, 1);
    const endDate = new Date(today.getFullYear(), 11, 31);

    return {
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
    };
  }

  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate),
  };
}

function mapBudgetPeriod(period: BudgetPeriod): BudgetInput["period"] {
  if (period === BudgetPeriod.QUARTERLY) {
    return "quarterly";
  }

  if (period === BudgetPeriod.YEARLY) {
    return "yearly";
  }

  return "monthly";
}

function mapBudgetPeriodToPrisma(period: BudgetInput["period"]) {
  if (period === "quarterly") {
    return BudgetPeriod.QUARTERLY;
  }

  if (period === "yearly") {
    return BudgetPeriod.YEARLY;
  }

  return BudgetPeriod.MONTHLY;
}

function normalizeOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : undefined;
}

function findCategoryById(categories: TransactionCategoryOption[], categoryId?: string) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

function getUncategorizedLabel() {
  return "Uncategorized spend";
}

function calculateDaysRemaining(endDate: string) {
  const end = new Date(`${endDate}T00:00:00`);
  const today = getTodayStart();
  const diff = end.getTime() - today.getTime();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function budgetIncludesExpense(
  budgetEntry: Pick<BudgetCookieEntry, "categoryId" | "startDate" | "endDate">,
  expense: TransactionRecord,
  categoryLabel?: string,
) {
  if (expense.type !== "expense") {
    return false;
  }

  if (
    expense.transactionDate < budgetEntry.startDate ||
    expense.transactionDate > budgetEntry.endDate
  ) {
    return false;
  }

  if (budgetEntry.categoryId) {
    return (
      expense.categoryId === budgetEntry.categoryId ||
      (categoryLabel ? expense.categoryLabel === categoryLabel : false)
    );
  }

  return !expense.categoryId || expense.categoryLabel === "Uncategorized";
}

function hydrateBudgetRecord(
  budgetEntry: BudgetCookieEntry,
  categories: TransactionCategoryOption[],
  expenses: TransactionRecord[],
) {
  const category = findCategoryById(categories, budgetEntry.categoryId);
  const categoryLabel = category?.label ?? getUncategorizedLabel();
  const spentAmount = expenses
    .filter((expense) => budgetIncludesExpense(budgetEntry, expense, category?.label))
    .reduce((total, expense) => total + expense.amount, 0);
  const remainingAmount = budgetEntry.limitAmount - spentAmount;
  const utilizationPercent =
    budgetEntry.limitAmount > 0 ? (spentAmount / budgetEntry.limitAmount) * 100 : 0;
  const status =
    utilizationPercent > 100
      ? "over"
      : utilizationPercent >= budgetEntry.alertPercent
        ? "watch"
        : "healthy";

  return budgetRecordSchema.parse({
    ...budgetEntry,
    categoryLabel,
    categoryColor: category?.color,
    spentAmount,
    remainingAmount,
    utilizationPercent,
    daysRemaining: calculateDaysRemaining(budgetEntry.endDate),
    status,
  });
}

function serializeBudgetsCookie(budgets: BudgetCookieEntry[]) {
  return JSON.stringify(budgetCookieEntrySchema.array().parse(budgets));
}

function buildWorkspaceState(
  budgets: BudgetRecord[],
  categories: TransactionCategoryOption[],
  source: BudgetWorkspaceState["source"],
): BudgetWorkspaceState {
  return {
    budgets,
    categories,
    summary: buildBudgetSummary(budgets),
    alerts: buildBudgetAlerts(budgets),
    source,
  };
}

function buildDemoBudgetEntries(
  profileType: "personal" | "freelancer" | "business",
  categories: TransactionCategoryOption[],
) {
  const now = new Date().toISOString();

  return demoBudgetSeedMap[profileType].map((seed) => {
    const range = getPeriodRange(seed.period);
    const category = seed.categorySlug
      ? categories.find((item) => item.slug === seed.categorySlug)
      : null;

    return budgetCookieEntrySchema.parse({
      id: seed.id,
      businessProfileId: undefined,
      categoryId: category?.id,
      name: seed.name,
      limitAmount: seed.limitAmount,
      period: seed.period,
      startDate: range.startDate,
      endDate: range.endDate,
      alertPercent: seed.alertPercent,
      carryForward: seed.carryForward,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function readDemoBudgetEntries(
  profileType: "personal" | "freelancer" | "business",
  categories: TransactionCategoryOption[],
) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(budgetCookieName)?.value;

  if (!rawValue) {
    return buildDemoBudgetEntries(profileType, categories);
  }

  try {
    return budgetCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return buildDemoBudgetEntries(profileType, categories);
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

async function readDatabaseBudgetState(
  viewer: ViewerContext,
  categories: TransactionCategoryOption[],
  expenses: TransactionRecord[],
) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const budgets = await context.prisma.budget.findMany({
    where: { userId: context.userId },
    include: { category: true },
    orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
  });

  const records = budgets.map((budget) =>
    hydrateBudgetRecord(
      budgetCookieEntrySchema.parse({
        id: budget.id,
        businessProfileId: budget.businessProfileId ?? undefined,
        categoryId: budget.categoryId ?? undefined,
        name: budget.name,
        limitAmount: Number(budget.limitAmount),
        period: mapBudgetPeriod(budget.period),
        startDate: formatLocalDate(budget.startDate),
        endDate: formatLocalDate(budget.endDate),
        alertPercent: budget.alertPercent,
        carryForward: budget.carryForward,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
      }),
      categories,
      expenses,
    ),
  );

  return {
    source: "database" as const,
    budgets: records,
  };
}

async function getBudgetBaseState(viewer: ViewerContext): Promise<BudgetWorkspaceState> {
  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const expenses = transactionState.transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const databaseState = await readDatabaseBudgetState(
    viewer,
    transactionState.categories,
    expenses,
  );

  if (databaseState) {
    return buildWorkspaceState(
      databaseState.budgets,
      transactionState.categories,
      "database",
    );
  }

  const budgetEntries = await readDemoBudgetEntries(
    onboardingState.profileType,
    transactionState.categories,
  );
  const budgets = budgetEntries.map((entry) =>
    hydrateBudgetRecord(entry, transactionState.categories, expenses),
  );

  return buildWorkspaceState(budgets, transactionState.categories, "demo");
}

async function createDatabaseBudget(
  input: BudgetInput,
  viewer: ViewerContext,
): Promise<BudgetMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const created = await context.prisma.budget.create({
    data: {
      userId: context.userId,
      businessProfileId: normalizeOptionalText(input.businessProfileId),
      categoryId: normalizeOptionalText(input.categoryId),
      name: input.name,
      limitAmount: input.limitAmount,
      period: mapBudgetPeriodToPrisma(input.period),
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      alertPercent: input.alertPercent,
      carryForward: input.carryForward,
    },
  });

  const state = await getBudgetBaseState(viewer);
  const budget = state.budgets.find((item) => item.id === created.id);

  if (!budget) {
    return null;
  }

  return {
    source: "database",
    budget,
    budgets: state.budgets,
    categories: state.categories,
    summary: state.summary,
    alerts: state.alerts,
    persistedBudgets: [],
  };
}

async function updateDatabaseBudget(
  budgetId: string,
  input: BudgetInput,
  viewer: ViewerContext,
): Promise<BudgetMutationResult | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await context.prisma.budget.update({
    where: { id: budgetId },
    data: {
      businessProfileId: normalizeOptionalText(input.businessProfileId),
      categoryId: normalizeOptionalText(input.categoryId),
      name: input.name,
      limitAmount: input.limitAmount,
      period: mapBudgetPeriodToPrisma(input.period),
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
      alertPercent: input.alertPercent,
      carryForward: input.carryForward,
    },
  });

  const state = await getBudgetBaseState(viewer);
  const budget = state.budgets.find((item) => item.id === budgetId);

  if (!budget) {
    return null;
  }

  return {
    source: "database",
    budget,
    budgets: state.budgets,
    categories: state.categories,
    summary: state.summary,
    alerts: state.alerts,
    persistedBudgets: [],
  };
}

async function deleteDatabaseBudget(budgetId: string, viewer: ViewerContext) {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const existing = await context.prisma.budget.findFirst({
    where: {
      id: budgetId,
      userId: context.userId,
    },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  await context.prisma.budget.delete({
    where: { id: budgetId },
  });

  return getBudgetBaseState(viewer);
}

export function getBudgetCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export async function getBudgetWorkspaceState(
  viewer: ViewerContext,
): Promise<BudgetWorkspaceState> {
  return getBudgetBaseState(viewer);
}

export async function createBudget(
  viewer: ViewerContext,
  input: BudgetInput,
): Promise<BudgetMutationResult> {
  const parsedInput = budgetInputSchema.parse(input);
  const databaseResult = await createDatabaseBudget(parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const expenses = transactionState.transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const persistedBudgets = await readDemoBudgetEntries(
    onboardingState.profileType,
    transactionState.categories,
  );
  const now = new Date().toISOString();
  const nextBudget = budgetCookieEntrySchema.parse({
    ...parsedInput,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  const nextPersistedBudgets = [nextBudget, ...persistedBudgets];
  const budgets = nextPersistedBudgets.map((entry) =>
    hydrateBudgetRecord(entry, transactionState.categories, expenses),
  );

  return {
    source: "demo",
    budget: budgets[0],
    budgets,
    categories: transactionState.categories,
    summary: buildBudgetSummary(budgets),
    alerts: buildBudgetAlerts(budgets),
    persistedBudgets: nextPersistedBudgets,
  };
}

export async function updateBudget(
  viewer: ViewerContext,
  budgetId: string,
  input: BudgetInput,
): Promise<BudgetMutationResult | null> {
  const parsedInput = budgetInputSchema.parse(input);
  const databaseResult = await updateDatabaseBudget(budgetId, parsedInput, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const expenses = transactionState.transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const persistedBudgets = await readDemoBudgetEntries(
    onboardingState.profileType,
    transactionState.categories,
  );
  const existingBudget = persistedBudgets.find((budget) => budget.id === budgetId);

  if (!existingBudget) {
    return null;
  }

  const nextPersistedBudgets = persistedBudgets.map((budget) =>
    budget.id === budgetId
      ? budgetCookieEntrySchema.parse({
          ...budget,
          ...parsedInput,
          updatedAt: new Date().toISOString(),
        })
      : budget,
  );
  const budgets = nextPersistedBudgets.map((entry) =>
    hydrateBudgetRecord(entry, transactionState.categories, expenses),
  );
  const budget = budgets.find((item) => item.id === budgetId);

  if (!budget) {
    return null;
  }

  return {
    source: "demo",
    budget,
    budgets,
    categories: transactionState.categories,
    summary: buildBudgetSummary(budgets),
    alerts: buildBudgetAlerts(budgets),
    persistedBudgets: nextPersistedBudgets,
  };
}

export async function deleteBudget(viewer: ViewerContext, budgetId: string) {
  const databaseResult = await deleteDatabaseBudget(budgetId, viewer);

  if (databaseResult) {
    return databaseResult;
  }

  const onboardingState = await getOnboardingState(viewer);
  const transactionState = await getTransactionWorkspaceState(viewer);
  const expenses = transactionState.transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const persistedBudgets = await readDemoBudgetEntries(
    onboardingState.profileType,
    transactionState.categories,
  );
  const nextPersistedBudgets = persistedBudgets.filter((budget) => budget.id !== budgetId);

  if (nextPersistedBudgets.length === persistedBudgets.length) {
    return null;
  }

  const budgets = nextPersistedBudgets.map((entry) =>
    hydrateBudgetRecord(entry, transactionState.categories, expenses),
  );

  return {
    budgets,
    categories: transactionState.categories,
    summary: buildBudgetSummary(budgets),
    alerts: buildBudgetAlerts(budgets),
    source: "demo" as const,
    persistedBudgets: nextPersistedBudgets,
  };
}

export function getSerializedBudgetsCookie(budgets: BudgetCookieEntry[]) {
  return serializeBudgetsCookie(budgets);
}
