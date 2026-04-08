import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  buildTransactionCategorizationPrompt,
  transactionCategorizationDeveloperPrompt,
} from "@/lib/ai/prompts/transaction-categorization";
import { appEnv } from "@/lib/env";
import type {
  CategorizationSuggestion,
  TransactionCategoryOption,
  TransactionRecord,
  TransactionRuleRecord,
} from "@/types/finance";

const aiCategorizationResultSchema = z.object({
  suggestedCategoryId: z.string().uuid(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  ruleMatchField: z.enum(["merchant", "title", "description"]).optional(),
  ruleMatchValue: z.string().optional(),
});

type HeuristicRule = {
  keywords: string[];
  slugs: string[];
  confidence: number;
  reason: string;
};

const heuristicRules: HeuristicRule[] = [
  {
    keywords: ["salary", "payroll", "employer", "payslip"],
    slugs: ["salary"],
    confidence: 0.94,
    reason: "Salary and payroll language strongly points to earned income.",
  },
  {
    keywords: ["retainer", "client", "invoice", "workshop", "project"],
    slugs: ["retainers"],
    confidence: 0.87,
    reason: "Client and invoice language suggests retained or project income.",
  },
  {
    keywords: ["dividend", "mutual fund", "investment", "interest", "sip"],
    slugs: ["investments"],
    confidence: 0.85,
    reason: "Investment-related keywords match portfolio income or returns.",
  },
  {
    keywords: ["rent", "housing", "apartment", "maintenance", "utility"],
    slugs: ["housing"],
    confidence: 0.82,
    reason: "Housing and utility terms align with living or office space costs.",
  },
  {
    keywords: ["grocery", "groceries", "swiggy", "zomato", "cafe", "restaurant", "food"],
    slugs: ["food"],
    confidence: 0.92,
    reason: "Food and grocery vendors usually belong in a food budget bucket.",
  },
  {
    keywords: ["figma", "notion", "software", "saas", "subscription", "renewal", "stack"],
    slugs: ["software"],
    confidence: 0.91,
    reason: "Software tooling and renewals fit the software category best.",
  },
  {
    keywords: ["gst", "tax", "tds", "filing", "compliance", "reserve"],
    slugs: ["tax"],
    confidence: 0.9,
    reason: "Tax, GST, and filing language points to a compliance or reserve expense.",
  },
  {
    keywords: ["travel", "uber", "ola", "flight", "hotel", "rail", "trip"],
    slugs: ["travel"],
    confidence: 0.89,
    reason: "Travel vendors and trip keywords map cleanly to travel spending.",
  },
];

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return openaiClient;
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function getCompatibleCategories(
  categories: TransactionCategoryOption[],
  transaction: TransactionRecord,
) {
  return categories.filter((category) => category.kind === transaction.type);
}

function buildTransactionContext(transaction: TransactionRecord) {
  return [
    transaction.title,
    transaction.merchantName,
    transaction.description,
    transaction.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function findMatchingRule(
  transaction: TransactionRecord,
  rules: TransactionRuleRecord[],
) {
  const candidates = {
    merchant: normalizeText(transaction.merchantName),
    title: normalizeText(transaction.title),
    description: normalizeText(transaction.description),
  } as const;

  return (
    rules.find((rule) => {
      const candidate = candidates[rule.matchField];

      return Boolean(candidate) && candidate.includes(normalizeText(rule.matchValue));
    }) ?? null
  );
}

function pickRuleSeed(transaction: TransactionRecord) {
  if (transaction.merchantName) {
    return {
      ruleMatchField: "merchant" as const,
      ruleMatchValue: transaction.merchantName,
    };
  }

  if (transaction.title.length >= 4) {
    return {
      ruleMatchField: "title" as const,
      ruleMatchValue: transaction.title,
    };
  }

  return undefined;
}

function buildFallbackSuggestion(
  transaction: TransactionRecord,
  categories: TransactionCategoryOption[],
): CategorizationSuggestion | null {
  const compatibleCategories = getCompatibleCategories(categories, transaction);

  if (!compatibleCategories.length) {
    return null;
  }

  const context = buildTransactionContext(transaction);
  const ruleSeed = pickRuleSeed(transaction);

  for (const heuristic of heuristicRules) {
    if (!heuristic.keywords.some((keyword) => context.includes(keyword))) {
      continue;
    }

    const matchedCategory =
      compatibleCategories.find((category) => heuristic.slugs.includes(category.slug)) ??
      compatibleCategories.find((category) =>
        heuristic.slugs.some((slug) => category.label.toLowerCase().includes(slug)),
      );

    if (!matchedCategory) {
      continue;
    }

    return {
      transactionId: transaction.id,
      transactionTitle: transaction.title,
      merchantName: transaction.merchantName,
      transactionType: transaction.type,
      suggestedCategoryId: matchedCategory.id,
      suggestedCategoryLabel: matchedCategory.label,
      confidence: heuristic.confidence,
      reason: heuristic.reason,
      ruleMatchField: ruleSeed?.ruleMatchField,
      ruleMatchValue: ruleSeed?.ruleMatchValue,
      source: "heuristic",
    };
  }

  const fallbackCategory = compatibleCategories[0];

  return {
    transactionId: transaction.id,
    transactionTitle: transaction.title,
    merchantName: transaction.merchantName,
    transactionType: transaction.type,
    suggestedCategoryId: fallbackCategory.id,
    suggestedCategoryLabel: fallbackCategory.label,
    confidence: 0.42,
    reason: "No strong keyword signal was found, so this is a low-confidence fallback suggestion.",
    ruleMatchField: ruleSeed?.ruleMatchField,
    ruleMatchValue: ruleSeed?.ruleMatchValue,
    source: "heuristic",
  };
}

async function categorizeWithOpenAI(
  transaction: TransactionRecord,
  categories: TransactionCategoryOption[],
) {
  const client = getOpenAIClient();

  if (!client || !appEnv.hasOpenAI) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: appEnv.openaiCategorizationModel,
      input: [
        {
          role: "developer",
          content: transactionCategorizationDeveloperPrompt,
        },
        {
          role: "user",
          content: buildTransactionCategorizationPrompt(transaction, categories),
        },
      ],
      text: {
        format: zodTextFormat(aiCategorizationResultSchema, "transaction_categorization"),
      },
    });

    return response.output_parsed ?? null;
  } catch {
    return null;
  }
}

export async function suggestTransactionCategories(
  transactions: TransactionRecord[],
  categories: TransactionCategoryOption[],
  rules: TransactionRuleRecord[],
) {
  const suggestions: CategorizationSuggestion[] = [];

  for (const transaction of transactions) {
    if (transaction.type === "transfer") {
      continue;
    }

    const compatibleCategories = getCompatibleCategories(categories, transaction);

    if (!compatibleCategories.length) {
      continue;
    }

    const ruleMatch = findMatchingRule(transaction, rules);

    if (ruleMatch) {
      suggestions.push({
        transactionId: transaction.id,
        transactionTitle: transaction.title,
        merchantName: transaction.merchantName,
        transactionType: transaction.type,
        suggestedCategoryId: ruleMatch.categoryId,
        suggestedCategoryLabel: ruleMatch.categoryLabel,
        confidence: 0.99,
        reason: `Saved ${ruleMatch.matchField} rule matched this transaction.`,
        ruleMatchField: ruleMatch.matchField,
        ruleMatchValue: ruleMatch.matchValue,
        source: "rule",
      });
      continue;
    }

    const openAISuggestion = await categorizeWithOpenAI(transaction, compatibleCategories);
    const resolvedCategory =
      openAISuggestion &&
      compatibleCategories.find((category) => category.id === openAISuggestion.suggestedCategoryId);

    if (openAISuggestion && resolvedCategory) {
      suggestions.push({
        transactionId: transaction.id,
        transactionTitle: transaction.title,
        merchantName: transaction.merchantName,
        transactionType: transaction.type,
        suggestedCategoryId: resolvedCategory.id,
        suggestedCategoryLabel: resolvedCategory.label,
        confidence: openAISuggestion.confidence,
        reason: openAISuggestion.reason,
        ruleMatchField: openAISuggestion.ruleMatchField,
        ruleMatchValue: openAISuggestion.ruleMatchValue,
        source: "openai",
      });
      continue;
    }

    const fallbackSuggestion = buildFallbackSuggestion(transaction, compatibleCategories);

    if (fallbackSuggestion) {
      suggestions.push(fallbackSuggestion);
    }
  }

  return suggestions;
}
