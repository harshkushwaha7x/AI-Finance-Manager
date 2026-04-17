import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  getProfileSettingsCookieOptions,
  getProfileWorkspaceState,
  getSerializedProfileSettingsCookie,
  profileSettingsCookieName,
  updateProfileWorkspace,
} from "@/lib/services/settings";
import { profileUpdateSchema } from "@/lib/validations/settings";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getProfileWorkspaceState(viewer);

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
  const parsed = profileUpdateSchema.safeParse(body);

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
  const result = await updateProfileWorkspace(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Profile updated.",
      ...result,
    },
    { status: 200 },
  );

  if (result.source === "demo" && result.persistedProfile) {
    response.cookies.set(
      profileSettingsCookieName,
      getSerializedProfileSettingsCookie(result.persistedProfile),
      getProfileSettingsCookieOptions(),
    );
  }

  return response;
}
