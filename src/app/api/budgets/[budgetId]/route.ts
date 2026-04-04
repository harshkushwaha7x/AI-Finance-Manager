import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  budgetCookieName,
  deleteBudget,
  getBudgetCookieOptions,
  getSerializedBudgetsCookie,
  updateBudget,
} from "@/lib/services/budgets";
import { budgetInputSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<unknown>;
};

async function getBudgetIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("budgetId" in resolvedParams) ||
    typeof resolvedParams.budgetId !== "string"
  ) {
    return null;
  }

  return resolvedParams.budgetId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

  const budgetId = await getBudgetIdFromContext(params);

  if (!budgetId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Budget id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await updateBudget(viewer, budgetId, parsed.data);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Budget not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Budget updated.",
      budget: result.budget,
      budgets: result.budgets,
      summary: result.summary,
      alerts: result.alerts,
      categories: result.categories,
      source: result.source,
    },
    { status: 200 },
  );

  if (result.source === "demo" && "persistedBudgets" in result) {
    response.cookies.set(
      budgetCookieName,
      getSerializedBudgetsCookie(result.persistedBudgets),
      getBudgetCookieOptions(),
    );
  }

  return response;
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const budgetId = await getBudgetIdFromContext(params);

  if (!budgetId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Budget id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await deleteBudget(viewer, budgetId);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Budget not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Budget deleted.",
      deletedId: budgetId,
      budgets: result.budgets,
      summary: result.summary,
      alerts: result.alerts,
      categories: result.categories,
      source: result.source,
    },
    { status: 200 },
  );

  if (result.source === "demo" && "persistedBudgets" in result) {
    response.cookies.set(
      budgetCookieName,
      getSerializedBudgetsCookie(result.persistedBudgets),
      getBudgetCookieOptions(),
    );
  }

  return response;
}
