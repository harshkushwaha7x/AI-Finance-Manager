import { NextResponse } from "next/server";

import { extractDocumentForReview } from "@/lib/ai/document-processing";
import { getViewerContext } from "@/lib/auth/viewer";
import {
  documentCookieName,
  getDocumentCookieOptions,
  getDocumentRecordById,
  getSerializedDocumentsCookie,
  updateDocumentRecord,
} from "@/lib/services/documents";
import { documentExtractionRequestSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = documentExtractionRequestSchema.safeParse(body);

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
  const document = await getDocumentRecordById(viewer, parsed.data.documentId);

  if (!document) {
    return NextResponse.json(
      {
        ok: false,
        message: "Document not found.",
      },
      { status: 404 },
    );
  }

  const extraction = await extractDocumentForReview(document);
  const result = await updateDocumentRecord(viewer, document.id, {
    status: extraction.status,
    extractedData: extraction.extractedData,
    aiSummary: extraction.summary,
  });

  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to persist extraction results.",
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      message: "Extraction complete.",
      document: result.document,
      documents: result.documents,
      summary: result.summary,
      source: result.source,
      extractionSource: extraction.source,
      receipt: extraction.receipt,
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
