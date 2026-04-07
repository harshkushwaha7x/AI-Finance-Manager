"use client";

import { CloudUpload, RefreshCcw } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDocumentFileSize,
  formatDocumentKindLabel,
} from "@/features/documents/document-utils";
import { cn } from "@/lib/utils";
import type { DocumentUploadQueueItem } from "@/types/documents";

type DocumentUploadPanelProps = {
  queueItems: DocumentUploadQueueItem[];
  onFilesSelected: (files: File[]) => void;
  onRetryUpload: (queueId: string) => void;
};

export function DocumentUploadPanel({
  queueItems,
  onFilesSelected,
  onRetryUpload,
}: DocumentUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Upload center</p>
        <CardTitle className="mt-3">Drop receipts, bills, invoices, and finance docs here</CardTitle>
        <p className="text-sm leading-7 text-muted">
          The upload queue now supports demo persistence and Supabase signed uploads, so this
          workflow is ready for real file storage without changing the UI later.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <button
          type="button"
          onClick={openFilePicker}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            onFilesSelected(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center rounded-[1.6rem] border border-dashed px-6 py-12 text-center transition",
            isDragging
              ? "border-primary bg-primary/8"
              : "border-black/10 bg-surface-subtle hover:border-primary/30",
          )}
        >
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <CloudUpload className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
            Drop files here or browse from your device
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
            Supports images, PDFs, and other finance documents. Receipts and image uploads can
            flow into OCR next, while invoices and bills stay ready for operations review.
          </p>
          <div className="mt-5">
            <Badge variant="secondary">Signed uploads ready</Badge>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept="image/*,.pdf,.zip,.csv,.xlsx,.xls,.doc,.docx,.txt"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);

            if (files.length) {
              onFilesSelected(files);
            }

            event.currentTarget.value = "";
          }}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Upload queue</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {queueItems.length} item{queueItems.length === 1 ? "" : "s"}
            </p>
          </div>
          {queueItems.length ? (
            queueItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.fileName}</p>
                    <p className="mt-2 text-sm text-muted">
                      {formatDocumentKindLabel(item.kind)} / {formatDocumentFileSize(item.fileSize)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        item.status === "failed"
                          ? "danger"
                          : item.status === "done"
                            ? "success"
                            : "warning"
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.status === "failed" ? (
                      <Button variant="secondary" size="sm" onClick={() => onRetryUpload(item.id)}>
                        <RefreshCcw className="h-4 w-4" />
                        Retry
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width]",
                      item.status === "failed"
                        ? "bg-danger"
                        : item.status === "done"
                          ? "bg-success"
                          : "bg-primary",
                    )}
                    style={{ width: `${Math.min(100, Math.max(item.progress, 4))}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {item.errorMessage ||
                    (item.status === "processing"
                      ? "Stored successfully and now waiting for the next extraction step."
                      : item.status === "done"
                        ? "Upload finished and document record created."
                        : "Preparing storage target and upload metadata.")}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6 text-sm leading-7 text-muted">
              New uploads will appear here with progress, errors, and retry actions.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
