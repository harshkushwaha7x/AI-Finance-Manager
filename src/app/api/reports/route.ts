import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import { getReportWorkspaceState } from "@/lib/services/reports";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getReportWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}
