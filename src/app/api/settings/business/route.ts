import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  getSerializedWorkspaceSettingsCookie,
  getSettingsWorkspaceState,
  getWorkspaceSettingsCookieOptions,
  updateBusinessSettingsWorkspace,
  workspaceSettingsCookieName,
} from "@/lib/services/settings";
import { businessSettingsUpdateSchema } from "@/lib/validations/settings";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getSettingsWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = businessSettingsUpdateSchema.safeParse(body);

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
  const result = await updateBusinessSettingsWorkspace(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Business settings updated.",
      ...result,
    },
    { status: 200 },
  );

  if (result.source === "demo" && result.persistedSettings) {
    response.cookies.set(
      workspaceSettingsCookieName,
      getSerializedWorkspaceSettingsCookie(result.persistedSettings),
      getWorkspaceSettingsCookieOptions(),
    );
  }

  return response;
}
