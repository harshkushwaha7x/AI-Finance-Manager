import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  budgetCookieName,
  createBudget,
  getBudgetCookieOptions,
  getBudgetWorkspaceState,
  getSerializedBudgetsCookie,
} from "@/lib/services/budgets";
import { budgetInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getBudgetWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = budgetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Validation failed.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await createBudget(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Budget created.",
      budget: result.budget,
      budgets: result.budgets,
      summary: result.summary,
      alerts: result.alerts,
      categories: result.categories,
      source: result.source,
    },
    { status: 201 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      budgetCookieName,
      getSerializedBudgetsCookie(result.persistedBudgets),
      getBudgetCookieOptions(),
    );
  }

  return response;
}
