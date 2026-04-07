import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import {
  documentCookieName,
  getDocumentCookieOptions,
  getSerializedDocumentsCookie,
  updateDocumentRecord,
} from "@/lib/services/documents";
import { documentUpdateInputSchema } from "@/lib/validations/finance";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const body = await request.json();
  const parsed = documentUpdateInputSchema.safeParse(body);

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

  const { documentId } = await context.params;
  const viewer = await getViewerContext();
  const result = await updateDocumentRecord(viewer, documentId, parsed.data);

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Document not found.",
      },
      { status: 404 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Document updated.",
      document: result.document,
      documents: result.documents,
      summary: result.summary,
      source: result.source,
    },
    { status: 200 },
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
