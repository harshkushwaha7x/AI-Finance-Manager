"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { DocumentPreviewDialog } from "@/features/documents/document-preview-dialog";
import { ReceiptExtractionPanel } from "@/features/receipts/receipt-extraction-panel";
import { ReceiptReviewQueue } from "@/features/receipts/receipt-review-queue";
import { ReceiptSummaryStrip } from "@/features/receipts/receipt-summary-strip";
import {
  buildReceiptWorkspaceSummary,
  hydrateReceiptRecord,
  sortReceiptsForWorkspace,
} from "@/features/receipts/receipt-utils";
import type {
  DocumentRecord,
  ReceiptExtractionResult,
} from "@/types/finance";
import type { ReceiptRecord, ReceiptWorkspaceState } from "@/types/receipts";

type ReceiptsWorkspaceProps = {
  initialState: ReceiptWorkspaceState;
};

type ReceiptMutationPayload = {
  ok?: boolean;
  message?: string;
  document?: DocumentRecord;
  extractionSource?: string;
  receipt?: ReceiptExtractionResult | null;
};

function buildManualSummary(review: ReceiptExtractionResult, markReviewed: boolean) {
  const vendor = review.vendorName || "Vendor pending";
  const amount =
    typeof review.totalAmount === "number"
      ? `${review.currency} ${review.totalAmount.toFixed(2)}`
      : "amount pending";
  const date = review.transactionDate || "date pending";

  return `${vendor} / ${amount} / ${date} / ${markReviewed ? "reviewed" : "manual correction saved"}`;
}

export function ReceiptsWorkspace({ initialState }: ReceiptsWorkspaceProps) {
  const [receipts, setReceipts] = useState(initialState.receipts);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(
    initialState.receipts[0]?.id ?? null,
  );
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptRecord | null>(null);
  const [extractingReceiptId, setExtractingReceiptId] = useState<string | null>(null);
  const [savingReceiptId, setSavingReceiptId] = useState<string | null>(null);

  const summary = useMemo(() => buildReceiptWorkspaceSummary(receipts), [receipts]);
  const activeReceipt = receipts.find((receipt) => receipt.id === activeReceiptId) ?? null;

  function replaceReceipt(updatedDocument: DocumentRecord) {
    const updatedReceipt = hydrateReceiptRecord(updatedDocument);

    setReceipts((current) => {
      const nextReceipts = sortReceiptsForWorkspace(
        current.map((receipt) => (receipt.id === updatedReceipt.id ? updatedReceipt : receipt)),
      );

      return nextReceipts;
    });
    setActiveReceiptId(updatedReceipt.id);
  }

  async function handleRunExtraction(receipt: ReceiptRecord) {
    try {
      setExtractingReceiptId(receipt.id);

      const response = await fetch("/api/documents/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: receipt.id,
        }),
      });
      const payload = (await response.json()) as ReceiptMutationPayload;

      if (!response.ok || !payload.document) {
        throw new Error(payload.message ?? "Unable to extract receipt fields.");
      }

      replaceReceipt(payload.document);
      toast.success("Receipt extraction updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setExtractingReceiptId(null);
    }
  }

  async function handleSaveReview(
    receipt: ReceiptRecord,
    review: ReceiptExtractionResult,
    markReviewed: boolean,
  ) {
    try {
      setSavingReceiptId(receipt.id);

      const response = await fetch(`/api/documents/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: markReviewed ? "completed" : "review",
          reviewedAt: markReviewed ? new Date().toISOString() : undefined,
          aiSummary: buildManualSummary(review, markReviewed),
          extractedData: {
            receipt: review,
            extractionSource: "manual",
            extractedAt: new Date().toISOString(),
          },
        }),
      });
      const payload = (await response.json()) as ReceiptMutationPayload;

      if (!response.ok || !payload.document) {
        throw new Error(payload.message ?? "Unable to save receipt review.");
      }

      replaceReceipt(payload.document);
      toast.success(markReviewed ? "Receipt marked reviewed." : "Receipt corrections saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setSavingReceiptId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Receipt review"
        title="Review extracted receipt fields before they hit the ledger"
        description="This workspace now runs a real extraction route, stores structured receipt data on the document record, and gives you a manual correction pass before anything downstream depends on it."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
      />
      <ReceiptSummaryStrip summary={summary} />
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ReceiptReviewQueue
          receipts={receipts}
          activeReceiptId={activeReceiptId ?? undefined}
          extractingReceiptId={extractingReceiptId}
          onSelect={(receipt) => setActiveReceiptId(receipt.id)}
          onExtract={(receipt) => {
            void handleRunExtraction(receipt);
          }}
        />
        <ReceiptExtractionPanel
          receipt={activeReceipt}
          isExtracting={extractingReceiptId === activeReceipt?.id}
          isSaving={savingReceiptId === activeReceipt?.id}
          onRunExtraction={(receipt) => {
            void handleRunExtraction(receipt);
          }}
          onSaveReview={(receipt, review, markReviewed) => {
            void handleSaveReview(receipt, review, markReviewed);
          }}
          onOpenPreview={(receipt) => setPreviewReceipt(receipt)}
        />
      </section>
      <DocumentPreviewDialog
        document={previewReceipt}
        open={Boolean(previewReceipt)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewReceipt(null);
          }
        }}
      />
    </div>
  );
}
