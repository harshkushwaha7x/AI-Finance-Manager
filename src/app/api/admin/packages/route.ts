import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import {
  accountantPackageCookieName,
  createAccountantPackage,
  getAccountantPackageCookieOptions,
  getAccountantWorkspaceState,
  getSerializedAccountantPackagesCookie,
} from "@/lib/services/accountant";
import { adminPackageInputSchema } from "@/lib/validations/admin";

export async function GET() {
  const viewer = await getViewerContext();
  assertAdminAccess(viewer);

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = adminPackageInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid package payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    assertAdminAccess(viewer);

    const result = await createAccountantPackage(parsed.data);
    const response = NextResponse.json(
      {
        ok: true,
        message: "Package created.",
        package: result.package,
        packages: result.packages,
        source: result.source,
      },
      { status: 201 },
    );

    if (result.source === "demo") {
      response.cookies.set(
        accountantPackageCookieName,
        getSerializedAccountantPackagesCookie(result.persistedPackages),
        getAccountantPackageCookieOptions(),
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create package.",
      },
      { status: 400 },
    );
  }
}
