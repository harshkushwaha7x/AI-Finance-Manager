import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  accountantRequestCookieName,
  createAccountantRequest,
  getAccountantCookieOptions,
  getAccountantWorkspaceState,
  getSerializedAccountantRequestsCookie,
} from "@/lib/services/accountant";
import { accountantRequestInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getAccountantWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = accountantRequestInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid accountant request payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const viewer = await getViewerContext();
    const result = await createAccountantRequest(viewer, parsed.data);
    const response = NextResponse.json(
      {
        ok: true,
        message: "Accountant request created.",
        request: result.request,
        requests: result.requests,
        packages: result.packages,
        summary: result.summary,
        source: result.source,
      },
      { status: 201 },
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
          error instanceof Error
            ? error.message
            : "Unable to create accountant request.",
      },
      { status: 400 },
    );
  }
}
