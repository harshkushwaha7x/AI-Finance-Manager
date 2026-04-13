import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  getSerializedTaxNotesCookie,
  getTaxNotesCookieOptions,
  getTaxWorkspaceState,
  taxNotesCookieName,
  updateTaxWorkspaceNotes,
} from "@/lib/services/tax-center";
import { taxNotesInputSchema, taxPeriodSchema } from "@/lib/validations/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedPeriod = taxPeriodSchema.safeParse(searchParams.get("period") ?? "this_month");

  if (!parsedPeriod.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid tax period.",
        errors: parsedPeriod.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const workspaceState = await getTaxWorkspaceState(viewer, parsedPeriod.data);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = taxNotesInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid tax note payload.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const viewer = await getViewerContext();
  const workspaceState = await updateTaxWorkspaceNotes(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Tax notes saved.",
      ...workspaceState,
    },
    { status: 200 },
  );

  response.cookies.set(
    taxNotesCookieName,
    getSerializedTaxNotesCookie(workspaceState.persistedNotes),
    getTaxNotesCookieOptions(),
  );

  return response;
}
