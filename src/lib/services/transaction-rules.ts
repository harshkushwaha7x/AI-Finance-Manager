import "server-only";

import { RuleCreatedBy, RuleMatchField } from "@prisma/client";
import { cookies } from "next/headers";
import { z } from "zod";

import type { ViewerContext } from "@/lib/auth/viewer";
import { getPrismaClient } from "@/lib/db";
import { appEnv } from "@/lib/env";
import type {
  TransactionCategoryOption,
  TransactionInput,
  TransactionRuleRecord,
} from "@/types/finance";
import { transactionRuleRecordSchema } from "@/lib/validations/finance";

export const transactionRuleCookieName = "afm-transaction-rules";

const transactionRuleCookieEntrySchema = transactionRuleRecordSchema;

const transactionRuleInputSchema = z.object({
  matchField: z.enum(["merchant", "title", "description"]),
  matchValue: z.string().min(1),
  categoryId: z.string().uuid(),
  createdBy: z.enum(["user", "ai"]).default("ai"),
});

type TransactionRuleCookieEntry = z.infer<typeof transactionRuleCookieEntrySchema>;
type TransactionRuleInput = z.infer<typeof transactionRuleInputSchema>;

type TransactionRuleMutationResult = {
  source: "demo" | "database";
  rules: TransactionRuleRecord[];
  persistedRules: TransactionRuleCookieEntry[];
};

function normalizeRuleValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : "";
}

function isSameRule(
  left: Pick<TransactionRuleRecord, "matchField" | "matchValue" | "categoryId">,
  right: Pick<TransactionRuleRecord, "matchField" | "matchValue" | "categoryId">,
) {
  return (
    left.matchField === right.matchField &&
    normalizeRuleValue(left.matchValue) === normalizeRuleValue(right.matchValue) &&
    left.categoryId === right.categoryId
  );
}

function mapRuleMatchField(field: RuleMatchField): TransactionRuleRecord["matchField"] {
  if (field === RuleMatchField.TITLE) {
    return "title";
  }

  if (field === RuleMatchField.DESCRIPTION) {
    return "description";
  }

  return "merchant";
}

function mapRuleCreatedBy(value: RuleCreatedBy): TransactionRuleRecord["createdBy"] {
  return value === RuleCreatedBy.AI ? "ai" : "user";
}

function mapRuleMatchFieldToPrisma(field: TransactionRuleRecord["matchField"]) {
  if (field === "title") {
    return RuleMatchField.TITLE;
  }

  if (field === "description") {
    return RuleMatchField.DESCRIPTION;
  }

  return RuleMatchField.MERCHANT;
}

function mapRuleCreatedByToPrisma(createdBy: TransactionRuleRecord["createdBy"]) {
  return createdBy === "ai" ? RuleCreatedBy.AI : RuleCreatedBy.USER;
}

function getCategoryLabel(
  categories: TransactionCategoryOption[],
  categoryId: string,
) {
  return categories.find((category) => category.id === categoryId)?.label ?? "Uncategorized";
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

async function readDemoTransactionRules() {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(transactionRuleCookieName)?.value;

  if (!rawValue) {
    return [] satisfies TransactionRuleCookieEntry[];
  }

  try {
    return transactionRuleCookieEntrySchema.array().parse(JSON.parse(rawValue));
  } catch {
    return [];
  }
}

async function readDatabaseTransactionRules(
  viewer: ViewerContext,
): Promise<TransactionRuleRecord[] | null> {
  const context = await getDatabaseContext(viewer);

  if (!context) {
    return null;
  }

  const rules = await context.prisma.transactionRule.findMany({
    where: {
      userId: context.userId,
      active: true,
    },
    include: { category: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rules.map((rule) =>
    transactionRuleRecordSchema.parse({
      id: rule.id,
      matchField: mapRuleMatchField(rule.matchField),
      matchValue: rule.matchValue,
      categoryId: rule.categoryId,
      categoryLabel: rule.category.name,
      createdBy: mapRuleCreatedBy(rule.createdBy),
      active: rule.active,
      lastAppliedAt: rule.lastAppliedAt?.toISOString(),
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    }),
  );
}

export async function getTransactionRules(
  viewer: ViewerContext,
): Promise<TransactionRuleRecord[]> {
  const databaseRules = await readDatabaseTransactionRules(viewer);

  if (databaseRules) {
    return databaseRules;
  }

  return readDemoTransactionRules();
}

export async function createTransactionRule(
  viewer: ViewerContext,
  input: TransactionRuleInput,
  categories: TransactionCategoryOption[],
) {
  const result = await createTransactionRules(viewer, [input], categories);
  const parsedInput = transactionRuleInputSchema.parse(input);
  const rule =
    result.rules.find((candidate) =>
      isSameRule(candidate, {
        matchField: parsedInput.matchField,
        matchValue: parsedInput.matchValue,
        categoryId: parsedInput.categoryId,
      }),
    ) ?? null;

  return rule
    ? {
        ...result,
        rule,
      }
    : null;
}

export async function createTransactionRules(
  viewer: ViewerContext,
  inputs: TransactionRuleInput[],
  categories: TransactionCategoryOption[],
  existingRules?: TransactionRuleRecord[],
): Promise<TransactionRuleMutationResult> {
  const parsedInputs = inputs
    .map((input) => transactionRuleInputSchema.parse(input))
    .map((input) => ({
      ...input,
      matchValue: normalizeRuleValue(input.matchValue),
    }))
    .filter((input) => input.matchValue);

  if (!parsedInputs.length) {
    return {
      source: appEnv.hasDatabase && viewer.isSignedIn && viewer.email ? "database" : "demo",
      rules: existingRules ?? (await getTransactionRules(viewer)),
      persistedRules: existingRules ?? [],
    };
  }

  const baselineRules = existingRules ?? (await getTransactionRules(viewer));
  const context = await getDatabaseContext(viewer);

  if (context) {
    const seenRules = [...baselineRules];

    for (const input of parsedInputs) {
      const duplicateRule = seenRules.find((rule) => isSameRule(rule, input));

      if (duplicateRule) {
        continue;
      }

      const createdRule = await context.prisma.transactionRule.create({
        data: {
          userId: context.userId,
          matchField: mapRuleMatchFieldToPrisma(input.matchField),
          matchValue: input.matchValue,
          categoryId: input.categoryId,
          createdBy: mapRuleCreatedByToPrisma(input.createdBy),
          active: true,
        },
        include: { category: true },
      });

      seenRules.unshift(
        transactionRuleRecordSchema.parse({
          id: createdRule.id,
          matchField: input.matchField,
          matchValue: createdRule.matchValue,
          categoryId: createdRule.categoryId,
          categoryLabel: createdRule.category.name,
          createdBy: input.createdBy,
          active: true,
          lastAppliedAt: createdRule.lastAppliedAt?.toISOString(),
          createdAt: createdRule.createdAt.toISOString(),
          updatedAt: createdRule.updatedAt.toISOString(),
        }),
      );
    }

    return {
      source: "database",
      rules: await getTransactionRules(viewer),
      persistedRules: [],
    };
  }

  const nextRules = [...baselineRules];
  const now = new Date().toISOString();

  for (const input of parsedInputs) {
    const duplicateRule = nextRules.find((rule) => isSameRule(rule, input));

    if (duplicateRule) {
      continue;
    }

    nextRules.unshift(
      transactionRuleCookieEntrySchema.parse({
        id: crypto.randomUUID(),
        matchField: input.matchField,
        matchValue: input.matchValue,
        categoryId: input.categoryId,
        categoryLabel: getCategoryLabel(categories, input.categoryId),
        createdBy: input.createdBy,
        active: true,
        lastAppliedAt: undefined,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  return {
    source: "demo",
    rules: nextRules,
    persistedRules: nextRules,
  };
}

export async function findMatchingTransactionRule(
  viewer: ViewerContext,
  input: TransactionInput,
) {
  const rules = await getTransactionRules(viewer);

  if (!rules.length) {
    return null;
  }

  const candidateValues = {
    merchant: normalizeOptionalText(input.merchantName).toLowerCase(),
    title: normalizeOptionalText(input.title).toLowerCase(),
    description: normalizeOptionalText(input.description).toLowerCase(),
  } as const;

  const matchingRule =
    rules.find((rule) => {
      const candidateValue = candidateValues[rule.matchField];

      return Boolean(candidateValue) && candidateValue.includes(normalizeRuleValue(rule.matchValue));
    }) ?? null;

  return matchingRule;
}

export function getTransactionRuleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

export function getSerializedTransactionRulesCookie(rules: TransactionRuleCookieEntry[]) {
  return JSON.stringify(transactionRuleCookieEntrySchema.array().parse(rules));
}
