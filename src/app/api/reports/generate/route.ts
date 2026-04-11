import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  generateReportSnapshot,
  getReportCookieOptions,
  getSerializedReportHistoryCookie,
  reportHistoryCookieName,
} from "@/lib/services/reports";
import { reportRequestSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = reportRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid report request.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const workspaceState = await generateReportSnapshot(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Report generated.",
      ...workspaceState,
    },
    { status: 200 },
  );

  if (workspaceState.source === "demo") {
    response.cookies.set(
      reportHistoryCookieName,
      getSerializedReportHistoryCookie(workspaceState.history),
      getReportCookieOptions(),
    );
  }

  return response;
}
