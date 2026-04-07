import type { DocumentRecord, DocumentSummary, DocumentWorkspaceState } from "@/types/finance";

export type DocumentSavedViewId =
  | "all"
  | "receipts"
  | "invoices"
  | "processing"
  | "failed";

export type DocumentSavedView = {
  id: DocumentSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type DocumentPageFilters = {
  kind: string;
  status: string;
};

export type DocumentUploadQueueItem = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  kind: "receipt" | "invoice" | "bill" | "tax_doc" | "other";
  progress: number;
  status: "queued" | "uploading" | "processing" | "failed" | "done";
  errorMessage?: string;
};

export type DocumentWorkspaceViewState = {
  documents: DocumentRecord[];
  summary: DocumentSummary;
  source: DocumentWorkspaceState["source"];
};
