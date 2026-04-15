import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import {
  accountantPackageCookieName,
  getAccountantPackageCookieOptions,
  getSerializedAccountantPackagesCookie,
  updateAccountantPackage,
} from "@/lib/services/accountant";
import { adminPackageInputSchema } from "@/lib/validations/admin";

type RouteContext = {
  params: Promise<unknown>;
};

async function getPackageIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("packageId" in resolvedParams) ||
    typeof resolvedParams.packageId !== "string"
  ) {
    return null;
  }

  return resolvedParams.packageId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const packageId = await getPackageIdFromContext(params);

  if (!packageId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Package id is required.",
      },
      { status: 400 },
    );
  }

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

    const result = await updateAccountantPackage(packageId, parsed.data);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message: "Package not found.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Package updated.",
        package: result.package,
        packages: result.packages,
        source: result.source,
      },
      { status: 200 },
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
        message: error instanceof Error ? error.message : "Unable to update package.",
      },
      { status: 400 },
    );
  }
}
