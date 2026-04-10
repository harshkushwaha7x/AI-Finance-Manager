import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  generateInsightSnapshot,
  getInsightCookieOptions,
  getSerializedInsightHistoryCookie,
  insightHistoryCookieName,
} from "@/lib/services/insights";
import { insightRequestSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = insightRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid insight request.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const workspaceState = await generateInsightSnapshot(viewer);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Insights refreshed.",
      ...workspaceState,
    },
    { status: 200 },
  );

  if (workspaceState.source === "demo") {
    response.cookies.set(
      insightHistoryCookieName,
      getSerializedInsightHistoryCookie(workspaceState.history),
      getInsightCookieOptions(),
    );
  }

  return response;
}
