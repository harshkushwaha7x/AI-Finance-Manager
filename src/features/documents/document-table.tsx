"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import { DataTableShell } from "@/components/shared/data-table-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildDocumentSearchIndex,
  formatDocumentFileSize,
  formatDocumentKindLabel,
  formatDocumentStatusLabel,
  formatDocumentTimestamp,
  getDocumentStatusVariant,
} from "@/features/documents/document-utils";
import type { DocumentRecord } from "@/types/finance";

type DocumentTableProps = {
  documents: DocumentRecord[];
  onPreview: (document: DocumentRecord) => void;
};

type DocumentTableRow = DocumentRecord & {
  kindLabel: string;
  statusLabel: string;
  searchIndex: string;
};

export function DocumentTable({ documents, onPreview }: DocumentTableProps) {
  const tableRows: DocumentTableRow[] = documents.map((document) => ({
    ...document,
    kindLabel: formatDocumentKindLabel(document.kind),
    statusLabel: formatDocumentStatusLabel(document.status),
    searchIndex: buildDocumentSearchIndex(document),
  }));

  const columns: ColumnDef<DocumentTableRow>[] = [
    {
      accessorKey: "originalName",
      header: "Document",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.originalName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
            {row.original.storagePath}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "kindLabel",
      header: "Kind",
      cell: ({ row }) => <Badge variant="secondary">{row.original.kindLabel}</Badge>,
    },
    {
      accessorKey: "statusLabel",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getDocumentStatusVariant(row.original.status)}>
          {row.original.statusLabel}
        </Badge>
      ),
    },
    {
      accessorKey: "fileSize",
      header: "Size",
      cell: ({ row }) => formatDocumentFileSize(row.original.fileSize),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => formatDocumentTimestamp(row.original.updatedAt),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onPreview(row.original)}>
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      ),
    },
  ];

  return (
    <DataTableShell
      title="Document registry"
      description="Search uploaded files, review metadata, and open a focused preview without leaving the workspace."
      data={tableRows}
      columns={columns}
      searchKey="searchIndex"
      searchPlaceholder="Search file names, kinds, storage paths, and AI summaries"
      emptyTitle="No documents match these filters"
      emptyDescription="Reset the saved view or status filters to bring more uploaded files back into view."
    />
  );
}
