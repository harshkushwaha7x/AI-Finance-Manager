import { NextResponse } from "next/server";

import { getViewerContext } from "@/lib/auth/viewer";
import { documentSignedUploadRequestSchema } from "@/lib/validations/finance";
import {
  createSignedDocumentUploadTarget,
  inferDocumentKind,
} from "@/lib/storage/document-storage";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = documentSignedUploadRequestSchema.safeParse(body);

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
  const viewerKey = viewer.email ?? viewer.clerkUserId ?? viewer.name ?? "demo-workspace";
  const kind = parsed.data.kind ?? inferDocumentKind(parsed.data.fileName, parsed.data.mimeType);
  const target = await createSignedDocumentUploadTarget({
    viewerKey,
    kind,
    fileName: parsed.data.fileName,
  });

  return NextResponse.json(
    {
      ok: true,
      upload: target,
      kind,
    },
    { status: 200 },
  );
}
