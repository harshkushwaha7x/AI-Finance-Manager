"use client";

import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatDocumentFileSize,
  formatDocumentKindLabel,
  formatDocumentStatusLabel,
  getDocumentStatusVariant,
} from "@/features/documents/document-utils";
import type { DocumentRecord } from "@/types/finance";

type DocumentPreviewDialogProps = {
  document: DocumentRecord | null;
  previewUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-7 text-foreground">{value}</p>
    </div>
  );
}

export function DocumentPreviewDialog({
  document,
  previewUrl,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  if (!document) {
    return null;
  }

  const isImage = document.mimeType.startsWith("image/");
  const isPdf = document.mimeType === "application/pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Document preview</p>
          <DialogTitle>{document.originalName}</DialogTitle>
          <DialogDescription>
            Review the uploaded file metadata, current processing state, and the storage path that will later feed OCR and extraction pipelines.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge variant="secondary">{formatDocumentKindLabel(document.kind)}</Badge>
          <Badge variant={getDocumentStatusVariant(document.status)}>
            {formatDocumentStatusLabel(document.status)}
          </Badge>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[1.6rem] border border-black/6 bg-surface-subtle">
            {previewUrl && isImage ? (
              <div className="relative h-[28rem] w-full">
                <Image
                  src={previewUrl}
                  alt={document.originalName}
                  fill
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 70vw"
                  className="object-contain"
                />
              </div>
            ) : previewUrl && isPdf ? (
              <iframe title={document.originalName} src={previewUrl} className="h-[28rem] w-full bg-white" />
            ) : (
              <div className="flex h-[28rem] items-center justify-center p-8 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">Preview not available</p>
                  <p className="mt-3 max-w-md text-sm leading-7 text-muted">
                    This document is stored and tracked, but a live in-browser preview is only shown for files uploaded during the current session.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-4">
            <DetailItem label="Type" value={formatDocumentKindLabel(document.kind)} />
            <DetailItem label="Size" value={formatDocumentFileSize(document.fileSize)} />
            <DetailItem label="Mime type" value={document.mimeType} />
            <DetailItem label="Storage path" value={document.storagePath} />
            <DetailItem label="Status" value={formatDocumentStatusLabel(document.status)} />
            <DetailItem
              label="AI summary"
              value={document.aiSummary || "No extraction summary has been attached yet."}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
