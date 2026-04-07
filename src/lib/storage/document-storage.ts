import "server-only";

import { createSupabaseAdminClient } from "@/lib/db";
import { appEnv } from "@/lib/env";

const safeFileNamePattern = /[^a-zA-Z0-9._-]/g;

export type DocumentKind = "receipt" | "invoice" | "bill" | "tax_doc" | "other";

export type SignedUploadTarget = {
  bucket: string;
  storagePath: string;
  signedUrl?: string;
  token?: string;
  source: "supabase" | "demo";
};

export function sanitizeStorageFileName(fileName: string) {
  const normalizedFileName = fileName.trim().replaceAll(" ", "-").replace(safeFileNamePattern, "-");

  return normalizedFileName.toLowerCase() || "document";
}

export function inferDocumentKind(fileName: string, mimeType: string): DocumentKind {
  const normalizedName = fileName.toLowerCase();
  const normalizedType = mimeType.toLowerCase();

  if (normalizedName.includes("invoice")) {
    return "invoice";
  }

  if (normalizedName.includes("receipt") || normalizedType.startsWith("image/")) {
    return "receipt";
  }

  if (normalizedName.includes("bill")) {
    return "bill";
  }

  if (normalizedName.includes("gst") || normalizedName.includes("tax")) {
    return "tax_doc";
  }

  return "other";
}

export function buildDocumentStoragePath(input: {
  viewerKey?: string | null;
  kind: DocumentKind;
  fileName: string;
}) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const safeViewerKey =
    input.viewerKey?.trim().toLowerCase().replace(safeFileNamePattern, "-") || "demo-workspace";
  const safeFileName = sanitizeStorageFileName(input.fileName);

  return `${safeViewerKey}/${input.kind}/${year}/${month}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function createSignedDocumentUploadTarget(input: {
  viewerKey?: string | null;
  kind: DocumentKind;
  fileName: string;
}) {
  const bucket = appEnv.supabaseStorageBucket;
  const storagePath = buildDocumentStoragePath(input);

  if (!appEnv.hasSupabaseStorageAdmin) {
    return {
      bucket,
      storagePath,
      source: "demo" as const,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error || !data) {
      return {
        bucket,
        storagePath,
        source: "demo" as const,
      };
    }

    return {
      bucket,
      storagePath: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      source: "supabase" as const,
    };
  } catch {
    return {
      bucket,
      storagePath,
      source: "demo" as const,
    };
  }
}
