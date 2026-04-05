import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  createGoal,
  getGoalCookieOptions,
  getGoalWorkspaceState,
  getSerializedGoalsCookie,
  goalCookieName,
} from "@/lib/services/goals";
import { goalInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getGoalWorkspaceState(viewer);

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

  const viewer = await getViewerContext();
  const result = await createGoal(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Goal created.",
      goal: result.goal,
      goals: result.goals,
      summary: result.summary,
      source: result.source,
    },
    { status: 201 },
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
