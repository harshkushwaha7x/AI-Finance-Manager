import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import { getAccountantWorkspaceState } from "@/lib/services/accountant";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getAccountantWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      packages: workspaceState.packages,
      source: workspaceState.source,
    },
    { status: 200 },
  );
}
