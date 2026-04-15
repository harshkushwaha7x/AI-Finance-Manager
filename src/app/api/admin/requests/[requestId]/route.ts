import { NextResponse } from "next/server";

import { assertAdminAccess } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import {
  accountantRequestCookieName,
  getAccountantCookieOptions,
  getSerializedAccountantRequestsCookie,
  updateAccountantRequest,
} from "@/lib/services/accountant";
import { adminRequestUpdateSchema } from "@/lib/validations/admin";

type RouteContext = {
  params: Promise<unknown>;
};

async function getRequestIdFromContext(params: RouteContext["params"]) {
  const resolvedParams = await params;

  if (
    !resolvedParams ||
    typeof resolvedParams !== "object" ||
    !("requestId" in resolvedParams) ||
    typeof resolvedParams.requestId !== "string"
  ) {
    return null;
  }

  return resolvedParams.requestId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const requestId = await getRequestIdFromContext(params);

  if (!requestId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Request id is required.",
      },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = adminRequestUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid request update payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    assertAdminAccess(viewer);

    const result = await updateAccountantRequest(viewer, requestId, parsed.data);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message: "Accountant request not found.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Accountant request updated.",
        request: result.request,
        requests: result.requests,
        summary: result.summary,
        source: result.source,
      },
      { status: 200 },
    );

    if (result.source === "demo") {
      response.cookies.set(
        accountantRequestCookieName,
        getSerializedAccountantRequestsCookie(result.persistedRequests),
        getAccountantCookieOptions(),
      );
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to update accountant request.",
      },
      { status: 400 },
    );
  }
}
