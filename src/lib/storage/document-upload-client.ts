"use client";

import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";

export async function uploadFileToSignedDocumentTarget(input: {
  bucket: string;
  storagePath: string;
  token: string;
  file: File;
}) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(input.bucket)
    .uploadToSignedUrl(input.storagePath, input.token, input.file, {
      contentType: input.file.type,
      upsert: true,
    });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to upload the file.");
  }

  return data;
}
