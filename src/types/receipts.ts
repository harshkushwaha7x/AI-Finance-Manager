import type {
  DocumentRecord,
  DocumentWorkspaceState,
  ReceiptExtractionResult,
} from "@/types/finance";

export type ReceiptQueueStatus =
  | "needs_extraction"
  | "ready_for_review"
  | "reviewed"
  | "failed";

export type ReceiptRecord = DocumentRecord & {
  extraction: ReceiptExtractionResult | null;
  extractionSource: "openai" | "fallback" | "manual" | "invoice_scaffold" | null;
  queueStatus: ReceiptQueueStatus;
};

export type ReceiptWorkspaceSummary = {
  totalCount: number;
  needsExtractionCount: number;
  reviewCount: number;
  reviewedCount: number;
  highConfidenceCount: number;
};

export type ReceiptWorkspaceState = {
  receipts: ReceiptRecord[];
  summary: ReceiptWorkspaceSummary;
  source: DocumentWorkspaceState["source"];
};
