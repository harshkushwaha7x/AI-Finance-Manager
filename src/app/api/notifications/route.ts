import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import { getNotificationWorkspaceState } from "@/lib/services/notifications";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getNotificationWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}
