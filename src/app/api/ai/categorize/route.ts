import { NextResponse } from "next/server";

import { suggestTransactionCategories } from "@/lib/ai/transaction-categorization";
import { getViewerContext } from "@/lib/auth/viewer";
import {
  getSerializedTransactionRulesCookie,
  getTransactionRuleCookieOptions,
  transactionRuleCookieName,
} from "@/lib/services/transaction-rules";
import {
  applyCategorizationSuggestions,
  getSerializedTransactionsCookie,
  getTransactionCookieOptions,
  getTransactionWorkspaceState,
  transactionCookieName,
} from "@/lib/services/transactions";
import { categorizationRequestSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = categorizationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid categorization request.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();

  if (parsed.data.action === "suggest") {
    const workspaceState = await getTransactionWorkspaceState(viewer);
    const requestedIds = new Set(parsed.data.transactionIds);
    const queuedTransactions = workspaceState.transactions.filter(
      (transaction) =>
        requestedIds.has(transaction.id) &&
        transaction.type !== "transfer" &&
        !transaction.categoryId,
    );
    const suggestions = await suggestTransactionCategories(
      queuedTransactions,
      workspaceState.categories,
      workspaceState.rules,
    );

    return NextResponse.json(
      {
        ok: true,
        suggestions,
        source: workspaceState.source,
      },
      { status: 200 },
    );
  }

  const result = await applyCategorizationSuggestions(viewer, parsed.data.suggestions);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "No categorization updates were applied.",
      },
      { status: 400 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Categorization updates applied.",
      transactions: result.transactions,
      updatedTransactions: result.updatedTransactions,
      categories: result.categories,
      rules: result.rules,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      transactionCookieName,
      getSerializedTransactionsCookie(result.transactions),
      getTransactionCookieOptions(),
    );
    response.cookies.set(
      transactionRuleCookieName,
      getSerializedTransactionRulesCookie(result.rules),
      getTransactionRuleCookieOptions(),
    );
  }

  return response;
}
