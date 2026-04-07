import type {
  DocumentKind,
  DocumentRecord,
  DocumentStatus,
  DocumentSummary,
} from "@/types/finance";
import type {
  DocumentPageFilters,
  DocumentSavedView,
  DocumentSavedViewId,
} from "@/types/documents";

export function formatDocumentKindLabel(kind: DocumentKind) {
  if (kind === "tax_doc") {
    return "Tax doc";
  }

  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function formatDocumentStatusLabel(status: DocumentStatus) {
  if (status === "processing") {
    return "Processing";
  }

  if (status === "review") {
    return "Needs review";
  }

  if (status === "failed") {
    return "Failed";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Uploaded";
}

export function getDocumentStatusVariant(status: DocumentStatus) {
  if (status === "failed") {
    return "danger" as const;
  }

  if (status === "review") {
    return "warning" as const;
  }

  if (status === "completed") {
    return "success" as const;
  }

  return "secondary" as const;
}

export function formatDocumentFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

export function formatDocumentTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function inferDocumentKindFromFile(fileName: string, mimeType: string): DocumentKind {
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

export function buildDocumentSearchIndex(document: DocumentRecord) {
  return [
    document.originalName,
    document.mimeType,
    document.storagePath,
    formatDocumentKindLabel(document.kind),
    formatDocumentStatusLabel(document.status),
    document.aiSummary,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDocumentSummary(documents: DocumentRecord[]): DocumentSummary {
  return {
    totalCount: documents.length,
    receiptCount: documents.filter((document) => document.kind === "receipt").length,
    reviewCount: documents.filter((document) => document.status === "review").length,
    processingCount: documents.filter((document) => document.status === "processing").length,
    failedCount: documents.filter((document) => document.status === "failed").length,
  };
}

export function buildDocumentSavedViews(documents: DocumentRecord[]): DocumentSavedView[] {
  return [
    {
      id: "all",
      label: "All files",
      description: "Every uploaded document in the workspace.",
      count: documents.length,
    },
    {
      id: "receipts",
      label: "Receipts",
      description: "Receipt uploads ready for OCR and categorization.",
      count: documents.filter((document) => document.kind === "receipt").length,
    },
    {
      id: "invoices",
      label: "Invoices",
      description: "Bills and invoice files that tie into revenue workflows.",
      count: documents.filter((document) => document.kind === "invoice").length,
    },
    {
      id: "processing",
      label: "Processing",
      description: "Documents currently in the extraction pipeline.",
      count: documents.filter((document) => document.status === "processing").length,
    },
    {
      id: "failed",
      label: "Failed",
      description: "Uploads that need a retry or replacement file.",
      count: documents.filter((document) => document.status === "failed").length,
    },
  ];
}

export function applyDocumentSavedView(documents: DocumentRecord[], viewId: DocumentSavedViewId) {
  if (viewId === "receipts") {
    return documents.filter((document) => document.kind === "receipt");
  }

  if (viewId === "invoices") {
    return documents.filter((document) => document.kind === "invoice");
  }

  if (viewId === "processing") {
    return documents.filter((document) => document.status === "processing");
  }

  if (viewId === "failed") {
    return documents.filter((document) => document.status === "failed");
  }

  return documents;
}

export function applyDocumentPageFilters(documents: DocumentRecord[], filters: DocumentPageFilters) {
  return documents.filter((document) => {
    if (filters.kind !== "all" && document.kind !== filters.kind) {
      return false;
    }

    if (filters.status !== "all" && document.status !== filters.status) {
      return false;
    }

    return true;
  });
}
