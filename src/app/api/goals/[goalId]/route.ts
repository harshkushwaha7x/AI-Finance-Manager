import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  deleteGoal,
  getGoalCookieOptions,
  getSerializedGoalsCookie,
  goalCookieName,
  updateGoal,
} from "@/lib/services/goals";
import { goalInputSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<unknown>;
};

async function getGoalIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("goalId" in resolvedParams) ||
    typeof resolvedParams.goalId !== "string"
  ) {
    return null;
  }

  return resolvedParams.goalId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const body = await request.json();
  const parsed = goalInputSchema.safeParse(body);

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

  const goalId = await getGoalIdFromContext(params);

  if (!goalId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Goal id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await updateGoal(viewer, goalId, parsed.data);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Goal not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Goal updated.",
      goal: result.goal,
      goals: result.goals,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      goalCookieName,
      getSerializedGoalsCookie(result.persistedGoals),
      getGoalCookieOptions(),
    );
  }

  return response;
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const goalId = await getGoalIdFromContext(params);

  if (!goalId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Goal id is required.",
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const result = await deleteGoal(viewer, goalId);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Goal not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Goal deleted.",
      deletedId: goalId,
      goals: result.goals,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
  );

  if (result.source === "demo" && "persistedGoals" in result) {
    response.cookies.set(
      goalCookieName,
      getSerializedGoalsCookie(result.persistedGoals),
      getGoalCookieOptions(),
    );
  }

  return response;
}
