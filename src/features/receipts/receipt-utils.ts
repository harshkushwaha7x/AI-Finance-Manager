import { receiptExtractionResultSchema } from "@/lib/validations/finance";
import type { DocumentRecord, ReceiptExtractionResult } from "@/types/finance";
import type {
  ReceiptQueueStatus,
  ReceiptRecord,
  ReceiptWorkspaceSummary,
} from "@/types/receipts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getReceiptExtraction(document: DocumentRecord): ReceiptExtractionResult | null {
  const extractedData = document.extractedData;

  if (!isRecord(extractedData)) {
    return null;
  }

  const candidate = isRecord(extractedData.receipt) ? extractedData.receipt : extractedData;
  const parsed = receiptExtractionResultSchema.safeParse(candidate);

  return parsed.success ? parsed.data : null;
}

export function getReceiptExtractionSource(document: DocumentRecord): ReceiptRecord["extractionSource"] {
  const extractedData = document.extractedData;

  if (!isRecord(extractedData)) {
    return null;
  }

  const source = extractedData.extractionSource;

  if (
    source === "openai" ||
    source === "fallback" ||
    source === "manual" ||
    source === "invoice_scaffold"
  ) {
    return source;
  }

  return null;
}

export function getReceiptQueueStatus(
  document: DocumentRecord,
  extraction: ReceiptExtractionResult | null,
): ReceiptQueueStatus {
  if (document.status === "failed") {
    return "failed";
  }

  if (document.status === "completed" || document.reviewedAt) {
    return "reviewed";
  }

  if (extraction) {
    return "ready_for_review";
  }

  return "needs_extraction";
}

export function hydrateReceiptRecord(document: DocumentRecord): ReceiptRecord {
  const extraction = getReceiptExtraction(document);

  return {
    ...document,
    extraction,
    extractionSource: getReceiptExtractionSource(document),
    queueStatus: getReceiptQueueStatus(document, extraction),
  };
}

export function sortReceiptsForWorkspace(receipts: ReceiptRecord[]) {
  const statusOrder: Record<ReceiptQueueStatus, number> = {
    failed: 0,
    needs_extraction: 1,
    ready_for_review: 2,
    reviewed: 3,
  };

  return [...receipts].sort((left, right) => {
    const statusDifference = statusOrder[left.queueStatus] - statusOrder[right.queueStatus];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function buildReceiptWorkspaceSummary(receipts: ReceiptRecord[]): ReceiptWorkspaceSummary {
  return {
    totalCount: receipts.length,
    needsExtractionCount: receipts.filter((receipt) => receipt.queueStatus === "needs_extraction").length,
    reviewCount: receipts.filter((receipt) => receipt.queueStatus === "ready_for_review").length,
    reviewedCount: receipts.filter((receipt) => receipt.queueStatus === "reviewed").length,
    highConfidenceCount: receipts.filter(
      (receipt) => (receipt.extraction?.confidence ?? 0) >= 0.75,
    ).length,
  };
}

export function formatReceiptConfidence(confidence?: number) {
  return `${Math.round((confidence ?? 0) * 100)}%`;
}

export function formatReceiptSourceLabel(source: ReceiptRecord["extractionSource"]) {
  if (source === "openai") {
    return "OpenAI extraction";
  }

  if (source === "fallback") {
    return "Fallback extraction";
  }

  if (source === "manual") {
    return "Manual review";
  }

  if (source === "invoice_scaffold") {
    return "Invoice scaffold";
  }

  return "Not extracted";
}

export function formatReceiptQueueStatusLabel(status: ReceiptQueueStatus) {
  if (status === "needs_extraction") {
    return "Needs extraction";
  }

  if (status === "ready_for_review") {
    return "Ready for review";
  }

  if (status === "reviewed") {
    return "Reviewed";
  }

  return "Failed";
}

export function getReceiptQueueStatusVariant(status: ReceiptQueueStatus) {
  if (status === "reviewed") {
    return "success" as const;
  }

  if (status === "ready_for_review") {
    return "warning" as const;
  }

  if (status === "failed") {
    return "danger" as const;
  }

  return "secondary" as const;
}

export function buildReceiptSummaryLine(receipt: ReceiptRecord) {
  if (!receipt.extraction) {
    return receipt.aiSummary || "Run extraction to review vendor, date, and totals.";
  }

  const amount =
    typeof receipt.extraction.totalAmount === "number"
      ? `${receipt.extraction.currency} ${receipt.extraction.totalAmount.toFixed(2)}`
      : "Amount pending";
  const vendor = receipt.extraction.vendorName || "Vendor pending";
  const date = receipt.extraction.transactionDate || "Date pending";

  return `${vendor} / ${amount} / ${date}`;
}
