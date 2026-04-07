"use client";

import { useEffect, useState } from "react";
import { Eye, Save, ScanSearch } from "lucide-react";

import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  formatReceiptConfidence,
  formatReceiptQueueStatusLabel,
  formatReceiptSourceLabel,
  getReceiptQueueStatusVariant,
} from "@/features/receipts/receipt-utils";
import { formatDocumentFileSize, formatDocumentTimestamp } from "@/features/documents/document-utils";
import type { ReceiptExtractionResult } from "@/types/finance";
import type { ReceiptRecord } from "@/types/receipts";

type ReceiptReviewDraft = {
  vendorName: string;
  transactionDate: string;
  totalAmount: string;
  taxAmount: string;
  currency: string;
  probableCategory: string;
};

type ReceiptExtractionPanelProps = {
  receipt: ReceiptRecord | null;
  isExtracting: boolean;
  isSaving: boolean;
  onRunExtraction: (receipt: ReceiptRecord) => void;
  onSaveReview: (
    receipt: ReceiptRecord,
    review: ReceiptExtractionResult,
    markReviewed: boolean,
  ) => void;
  onOpenPreview: (receipt: ReceiptRecord) => void;
};

function buildDraft(receipt: ReceiptRecord | null): ReceiptReviewDraft {
  return {
    vendorName: receipt?.extraction?.vendorName ?? "",
    transactionDate: receipt?.extraction?.transactionDate ?? "",
    totalAmount:
      typeof receipt?.extraction?.totalAmount === "number"
        ? String(receipt.extraction.totalAmount)
        : "",
    taxAmount:
      typeof receipt?.extraction?.taxAmount === "number" ? String(receipt.extraction.taxAmount) : "",
    currency: receipt?.extraction?.currency ?? "INR",
    probableCategory: receipt?.extraction?.probableCategory ?? "",
  };
}

function buildReviewPayload(
  draft: ReceiptReviewDraft,
  existing: ReceiptExtractionResult | null,
): ReceiptExtractionResult {
  return {
    vendorName: draft.vendorName || undefined,
    transactionDate: draft.transactionDate || undefined,
    totalAmount: draft.totalAmount ? Number(draft.totalAmount) : undefined,
    taxAmount: draft.taxAmount ? Number(draft.taxAmount) : undefined,
    currency: draft.currency || "INR",
    probableCategory: draft.probableCategory || undefined,
    confidence: existing?.confidence ?? 0.5,
    lineItems: existing?.lineItems ?? [],
  };
}

export function ReceiptExtractionPanel({
  receipt,
  isExtracting,
  isSaving,
  onRunExtraction,
  onSaveReview,
  onOpenPreview,
}: ReceiptExtractionPanelProps) {
  const [draft, setDraft] = useState<ReceiptReviewDraft>(() => buildDraft(receipt));

  useEffect(() => {
    setDraft(buildDraft(receipt));
  }, [receipt]);

  if (!receipt) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full min-h-[34rem] items-center justify-center p-8 text-center">
          <div>
            <p className="font-display text-3xl font-bold text-foreground">Select a receipt</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-muted">
              Pick a receipt from the queue to review extracted values, correct fields, and mark
              the document ready for the next finance workflow.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reviewPayload = buildReviewPayload(draft, receipt.extraction);

  return (
    <Card className="h-full">
      <CardHeader>
        <SectionToolbar
          title="Extraction review"
          description="Inspect the receipt metadata, re-run extraction when needed, and manually correct the fields that will later shape transaction creation."
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => onOpenPreview(receipt)}>
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isExtracting}
                onClick={() => onRunExtraction(receipt)}
              >
                <ScanSearch className="h-4 w-4" />
                {isExtracting ? "Extracting..." : receipt.extraction ? "Re-run extraction" : "Run extraction"}
              </Button>
            </>
          }
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={getReceiptQueueStatusVariant(receipt.queueStatus)}>
            {formatReceiptQueueStatusLabel(receipt.queueStatus)}
          </Badge>
          <Badge variant="secondary">{formatReceiptSourceLabel(receipt.extractionSource)}</Badge>
          {receipt.extraction ? (
            <Badge variant="secondary">
              {formatReceiptConfidence(receipt.extraction.confidence)} confidence
            </Badge>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">File</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{receipt.originalName}</p>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Updated</p>
            <p className="mt-2 text-sm leading-7 text-foreground">
              {formatDocumentTimestamp(receipt.updatedAt)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">File size</p>
            <p className="mt-2 text-sm leading-7 text-foreground">
              {formatDocumentFileSize(receipt.fileSize)}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Storage path</p>
            <p className="mt-2 text-sm leading-7 text-foreground">{receipt.storagePath}</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Vendor name" htmlFor="receipt-vendor-name">
            <Input
              id="receipt-vendor-name"
              value={draft.vendorName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  vendorName: event.target.value,
                }))
              }
              placeholder="Vendor or store name"
            />
          </FormField>
          <FormField label="Transaction date" htmlFor="receipt-transaction-date">
            <Input
              id="receipt-transaction-date"
              type="date"
              value={draft.transactionDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  transactionDate: event.target.value,
                }))
              }
            />
          </FormField>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Total amount" htmlFor="receipt-total-amount">
            <Input
              id="receipt-total-amount"
              type="number"
              step="0.01"
              min="0"
              value={draft.totalAmount}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  totalAmount: event.target.value,
                }))
              }
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Tax amount" htmlFor="receipt-tax-amount">
            <Input
              id="receipt-tax-amount"
              type="number"
              step="0.01"
              min="0"
              value={draft.taxAmount}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  taxAmount: event.target.value,
                }))
              }
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Currency" htmlFor="receipt-currency">
            <Input
              id="receipt-currency"
              maxLength={3}
              value={draft.currency}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  currency: event.target.value.toUpperCase(),
                }))
              }
              placeholder="INR"
            />
          </FormField>
        </div>
        <FormField label="Probable category" htmlFor="receipt-probable-category">
          <Input
            id="receipt-probable-category"
            value={draft.probableCategory}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                probableCategory: event.target.value,
              }))
            }
            placeholder="Food, travel, software, tax"
          />
        </FormField>
        <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Line items</p>
          {receipt.extraction?.lineItems?.length ? (
            <div className="mt-4 space-y-3">
              {receipt.extraction.lineItems.map((lineItem, index) => (
                <div
                  key={`${lineItem.description}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-black/6 bg-white px-4 py-3"
                >
                  <p className="text-sm text-foreground">{lineItem.description}</p>
                  <p className="text-sm font-medium text-foreground">
                    {reviewPayload.currency} {lineItem.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-muted">
              No line items were extracted. You can still correct the receipt totals manually.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() => onSaveReview(receipt, reviewPayload, false)}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save corrections"}
          </Button>
          <Button disabled={isSaving} onClick={() => onSaveReview(receipt, reviewPayload, true)}>
            {isSaving ? "Saving..." : "Mark reviewed"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
