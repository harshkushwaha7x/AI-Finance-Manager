"use client";

import { ScanSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  buildReceiptSummaryLine,
  formatReceiptConfidence,
  formatReceiptQueueStatusLabel,
  formatReceiptSourceLabel,
  getReceiptQueueStatusVariant,
} from "@/features/receipts/receipt-utils";
import { formatDocumentTimestamp } from "@/features/documents/document-utils";
import { cn } from "@/lib/utils";
import type { ReceiptRecord } from "@/types/receipts";

type ReceiptReviewQueueProps = {
  receipts: ReceiptRecord[];
  activeReceiptId?: string;
  extractingReceiptId?: string | null;
  onSelect: (receipt: ReceiptRecord) => void;
  onExtract: (receipt: ReceiptRecord) => void;
};

export function ReceiptReviewQueue({
  receipts,
  activeReceiptId,
  extractingReceiptId,
  onSelect,
  onExtract,
}: ReceiptReviewQueueProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Review queue</p>
        <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
          Move through receipts in the order that actually matters
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          Failed and unprocessed receipts surface first, then extracted receipts that still need a
          manual pass before they can be trusted in the ledger.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {receipts.length ? (
          receipts.map((receipt) => {
            const isActive = receipt.id === activeReceiptId;
            const isExtracting = receipt.id === extractingReceiptId;

            return (
              <div
                key={receipt.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(receipt)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(receipt);
                  }
                }}
                className={cn(
                  "w-full rounded-[1.4rem] border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-ring",
                  isActive
                    ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                    : "border-black/6 bg-surface-subtle hover:border-primary/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{receipt.originalName}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {buildReceiptSummaryLine(receipt)}
                    </p>
                  </div>
                  <Badge variant={getReceiptQueueStatusVariant(receipt.queueStatus)}>
                    {formatReceiptQueueStatusLabel(receipt.queueStatus)}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{formatReceiptSourceLabel(receipt.extractionSource)}</Badge>
                  {receipt.extraction ? (
                    <Badge variant="secondary">
                      {formatReceiptConfidence(receipt.extraction.confidence)} confidence
                    </Badge>
                  ) : null}
                  <Badge variant="neutral">{formatDocumentTimestamp(receipt.updatedAt)}</Badge>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isExtracting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onExtract(receipt);
                    }}
                  >
                    <ScanSearch className="h-4 w-4" />
                    {isExtracting ? "Extracting..." : receipt.extraction ? "Re-run extraction" : "Run extraction"}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6 text-sm leading-7 text-muted">
            Receipt uploads from the document center will show up here for OCR review.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
