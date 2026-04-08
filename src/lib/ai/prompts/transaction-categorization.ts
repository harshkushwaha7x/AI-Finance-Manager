import type { TransactionCategoryOption, TransactionRecord } from "@/types/finance";

export const transactionCategorizationDeveloperPrompt = `
You categorize finance transactions into the most relevant provided category.
Prefer precision over creativity.
Use merchant, title, description, amount, and source together.
Do not invent new categories.
Return a confidence score between 0 and 1.
Pick a rule match field only when the match is stable enough to save as an automation rule.
If the transaction is ambiguous, keep confidence lower and explain why.
`.trim();

export function buildTransactionCategorizationPrompt(
  transaction: TransactionRecord,
  categories: TransactionCategoryOption[],
) {
  return [
    "Categorize this transaction using only the provided category list.",
    `Transaction title: ${transaction.title}`,
    `Merchant: ${transaction.merchantName || "Not provided"}`,
    `Description: ${transaction.description || "Not provided"}`,
    `Notes: ${transaction.notes || "Not provided"}`,
    `Type: ${transaction.type}`,
    `Source: ${transaction.source}`,
    `Amount: ${transaction.currency} ${transaction.amount.toFixed(2)}`,
    "Available categories:",
    ...categories.map((category) => `- ${category.id} / ${category.label} / ${category.kind}`),
  ].join("\n");
}
