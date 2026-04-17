import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  getSerializedWorkspaceSettingsCookie,
  getSettingsWorkspaceState,
  getWorkspaceSettingsCookieOptions,
  updateNotificationPreferencesWorkspace,
  workspaceSettingsCookieName,
} from "@/lib/services/settings";
import { notificationPreferencesSchema } from "@/lib/validations/settings";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getSettingsWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      notificationPreferences: workspaceState.notificationPreferences,
      source: workspaceState.source,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = notificationPreferencesSchema.safeParse(body);

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
  const result = await updateNotificationPreferencesWorkspace(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Notification preferences updated.",
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
