import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  createDocumentRecord,
  documentCookieName,
  getDocumentCookieOptions,
  getDocumentWorkspaceState,
  getSerializedDocumentsCookie,
} from "@/lib/services/documents";
import { documentCreateInputSchema } from "@/lib/validations/finance";

export async function GET() {
  const viewer = await getViewerContext();
  const workspaceState = await getDocumentWorkspaceState(viewer);

  return NextResponse.json(
    {
      ok: true,
      ...workspaceState,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = documentCreateInputSchema.safeParse(body);

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
  const result = await createDocumentRecord(viewer, parsed.data);
  const response = NextResponse.json(
    {
      ok: true,
      message: "Document recorded.",
      document: result.document,
      documents: result.documents,
      summary: result.summary,
      source: result.source,
    },
    { status: 201 },
  );

  if (result.source === "demo") {
    response.cookies.set(
      documentCookieName,
      getSerializedDocumentsCookie(result.persistedDocuments),
      getDocumentCookieOptions(),
    );
  }

  return response;
}
