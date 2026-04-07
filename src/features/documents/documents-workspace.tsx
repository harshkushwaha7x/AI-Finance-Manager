"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { DocumentFiltersPanel } from "@/features/documents/document-filters-panel";
import { DocumentPreviewDialog } from "@/features/documents/document-preview-dialog";
import { DocumentSavedViews } from "@/features/documents/document-saved-views";
import { DocumentSummaryStrip } from "@/features/documents/document-summary-strip";
import { DocumentTable } from "@/features/documents/document-table";
import { DocumentUploadPanel } from "@/features/documents/document-upload-panel";
import {
  applyDocumentPageFilters,
  applyDocumentSavedView,
  buildDocumentSavedViews,
  buildDocumentSummary,
  inferDocumentKindFromFile,
} from "@/features/documents/document-utils";
import { uploadFileToSignedDocumentTarget } from "@/lib/storage/document-upload-client";
import type {
  DocumentCreateInput,
  DocumentKind,
  DocumentRecord,
  DocumentSignedUploadTarget,
  DocumentStatus,
  DocumentSummary,
  DocumentWorkspaceState,
} from "@/types/finance";
import type {
  DocumentPageFilters,
  DocumentSavedViewId,
  DocumentUploadQueueItem,
} from "@/types/documents";

type DocumentsWorkspaceProps = {
  initialState: DocumentWorkspaceState;
};

type SignedUploadPayload = {
  ok?: boolean;
  message?: string;
  kind?: DocumentKind;
  upload?: DocumentSignedUploadTarget;
};

type DocumentMutationPayload = {
  ok?: boolean;
  message?: string;
  document?: DocumentRecord;
  documents?: DocumentRecord[];
  summary?: DocumentSummary;
  source?: DocumentWorkspaceState["source"];
};

type DocumentMutationSuccessPayload = {
  document: DocumentRecord;
  documents: DocumentRecord[];
  summary?: DocumentSummary;
  source?: DocumentWorkspaceState["source"];
};

const defaultDocumentPageFilters: DocumentPageFilters = {
  kind: "all",
  status: "all",
};

function wait(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

function getInitialDocumentStatus(kind: DocumentKind): DocumentStatus {
  if (kind === "receipt") {
    return "review";
  }

  if (kind === "other") {
    return "uploaded";
  }

  return "processing";
}

function getInitialDocumentSummary(kind: DocumentKind) {
  if (kind === "receipt") {
    return "Receipt uploaded and staged for OCR review.";
  }

  if (kind === "invoice") {
    return "Invoice uploaded and ready for extraction or bookkeeping review.";
  }

  if (kind === "bill") {
    return "Bill uploaded and staged for reconciliation.";
  }

  if (kind === "tax_doc") {
    return "Tax document stored for filing support and accountant review.";
  }

  return "Document uploaded successfully and staged for the next workflow.";
}

export function DocumentsWorkspace({ initialState }: DocumentsWorkspaceProps) {
  const [documents, setDocuments] = useState(initialState.documents);
  const [workspaceSource, setWorkspaceSource] = useState(initialState.source);
  const [pageFilters, setPageFilters] = useState<DocumentPageFilters>(defaultDocumentPageFilters);
  const [activeView, setActiveView] = useState<DocumentSavedViewId>("all");
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(
    initialState.documents[0] ?? null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<DocumentUploadQueueItem[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const queuedFilesRef = useRef(new Map<string, File>());
  const sessionPreviewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const previewUrls = sessionPreviewUrlsRef.current;

    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, []);

  const summary = useMemo(() => buildDocumentSummary(documents), [documents]);
  const savedViews = useMemo(() => buildDocumentSavedViews(documents), [documents]);
  const visibleDocuments = useMemo(
    () => applyDocumentPageFilters(applyDocumentSavedView(documents, activeView), pageFilters),
    [activeView, documents, pageFilters],
  );

  function updateQueueItem(queueId: string, updates: Partial<DocumentUploadQueueItem>) {
    setQueueItems((current) =>
      current.map((item) => (item.id === queueId ? { ...item, ...updates } : item)),
    );
  }

  function attachSessionPreviewUrl(documentId: string, file: File) {
    const previewUrl = URL.createObjectURL(file);

    sessionPreviewUrlsRef.current.push(previewUrl);
    setPreviewUrls((current) => ({
      ...current,
      [documentId]: previewUrl,
    }));
  }

  async function requestSignedUpload(file: File, kind: DocumentKind) {
    const response = await fetch("/api/uploads/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        kind,
      }),
    });
    const payload = (await response.json()) as SignedUploadPayload;

    if (!response.ok || !payload.upload) {
      throw new Error(payload.message ?? "Unable to prepare the upload target.");
    }

    return {
      upload: payload.upload,
      kind: payload.kind ?? kind,
    };
  }

  async function persistDocumentRecord(
    file: File,
    upload: DocumentSignedUploadTarget,
    kind: DocumentKind,
  ): Promise<DocumentMutationSuccessPayload> {
    const createPayload: DocumentCreateInput = {
      kind,
      originalName: file.name,
      storagePath: upload.storagePath,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      status: getInitialDocumentStatus(kind),
      aiSummary: getInitialDocumentSummary(kind),
    };
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload),
    });
    const payload = (await response.json()) as DocumentMutationPayload;

    if (!response.ok || !payload.document || !payload.documents) {
      throw new Error(payload.message ?? "Unable to create the document record.");
    }

    return {
      document: payload.document,
      documents: payload.documents,
      summary: payload.summary,
      source: payload.source,
    };
  }

  async function processUpload(queueId: string, file: File) {
    const initialKind = inferDocumentKindFromFile(file.name, file.type || "application/octet-stream");

    try {
      updateQueueItem(queueId, {
        kind: initialKind,
        status: "uploading",
        progress: 12,
        errorMessage: undefined,
      });

      const { upload, kind } = await requestSignedUpload(file, initialKind);

      updateQueueItem(queueId, {
        kind,
        status: "uploading",
        progress: 34,
      });

      if (upload.source === "supabase" && upload.token) {
        await uploadFileToSignedDocumentTarget({
          bucket: upload.bucket,
          storagePath: upload.storagePath,
          token: upload.token,
          file,
        });

        updateQueueItem(queueId, {
          status: "uploading",
          progress: 78,
        });
      } else {
        await wait(180);
        updateQueueItem(queueId, {
          status: "uploading",
          progress: 62,
        });
        await wait(160);
      }

      updateQueueItem(queueId, {
        status: "processing",
        progress: 90,
      });

      const payload = await persistDocumentRecord(file, upload, kind);

      setDocuments(payload.documents);
      setWorkspaceSource(payload.source ?? workspaceSource);
      setActiveDocument(payload.document);
      attachSessionPreviewUrl(payload.document.id, file);

      updateQueueItem(queueId, {
        status: "done",
        progress: 100,
      });

      toast.success(`${file.name} uploaded and added to the workspace.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";

      updateQueueItem(queueId, {
        status: "failed",
        progress: 100,
        errorMessage: message,
      });
      toast.error(message);
    }
  }

  async function handleFilesSelected(files: File[]) {
    if (!files.length) {
      return;
    }

    const nextQueueItems = files.map((file) => {
      const queueId = crypto.randomUUID();
      const queueItem: DocumentUploadQueueItem = {
        id: queueId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        kind: inferDocumentKindFromFile(file.name, file.type || "application/octet-stream"),
        progress: 0,
        status: "queued",
      };

      queuedFilesRef.current.set(queueId, file);

      return queueItem;
    });

    setQueueItems((current) => [...nextQueueItems, ...current]);

    for (const queueItem of nextQueueItems) {
      const file = queuedFilesRef.current.get(queueItem.id);

      if (!file) {
        continue;
      }

      await processUpload(queueItem.id, file);
    }
  }

  async function handleRetryUpload(queueId: string) {
    const file = queuedFilesRef.current.get(queueId);

    if (!file) {
      toast.error("The original file is no longer available. Please upload it again.");
      return;
    }

    updateQueueItem(queueId, {
      progress: 0,
      status: "queued",
      errorMessage: undefined,
    });

    await processUpload(queueId, file);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Documents"
        title="Stage a real upload center for receipts, invoices, and tax files"
        description="This workspace now supports signed upload preparation, tracked document records, preview-ready session files, and status-aware filtering before OCR lands."
        badge={workspaceSource === "database" ? "Database live" : "Demo persistence live"}
      />
      <DocumentSummaryStrip summary={summary} />
      <DocumentSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <DocumentUploadPanel
          queueItems={queueItems}
          onFilesSelected={(files) => {
            void handleFilesSelected(files);
          }}
          onRetryUpload={(queueId) => {
            void handleRetryUpload(queueId);
          }}
        />
        <DocumentFiltersPanel
          filters={pageFilters}
          onFiltersChange={setPageFilters}
          onReset={() => setPageFilters(defaultDocumentPageFilters)}
        />
      </section>
      <DocumentTable
        documents={visibleDocuments}
        onPreview={(document) => {
          setActiveDocument(document);
          setIsPreviewOpen(true);
        }}
      />
      <DocumentPreviewDialog
        document={activeDocument}
        previewUrl={activeDocument ? previewUrls[activeDocument.id] : undefined}
        open={isPreviewOpen && Boolean(activeDocument)}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);

          if (!open) {
            setActiveDocument(null);
          }
        }}
      />
    </div>
  );
}
