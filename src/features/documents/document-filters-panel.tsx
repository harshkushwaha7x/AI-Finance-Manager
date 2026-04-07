"use client";

import { RotateCcw } from "lucide-react";

import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import type { DocumentPageFilters } from "@/types/documents";

type DocumentFiltersPanelProps = {
  filters: DocumentPageFilters;
  onFiltersChange: (filters: DocumentPageFilters) => void;
  onReset: () => void;
};

export function DocumentFiltersPanel({
  filters,
  onFiltersChange,
  onReset,
}: DocumentFiltersPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <SectionToolbar
          title="Document filters"
          description="Filter the upload center by document type and processing state before you send anything into OCR or reports."
          actions={
            <Button variant="secondary" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-5">
        <FormField label="Kind" htmlFor="document-filter-kind">
          <Select
            id="document-filter-kind"
            value={filters.kind}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                kind: event.target.value,
              })
            }
          >
            <option value="all">All kinds</option>
            <option value="receipt">Receipt</option>
            <option value="invoice">Invoice</option>
            <option value="bill">Bill</option>
            <option value="tax_doc">Tax doc</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="document-filter-status">
          <Select
            id="document-filter-status"
            value={filters.status}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                status: event.target.value,
              })
            }
          >
            <option value="all">All statuses</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="review">Needs review</option>
            <option value="failed">Failed</option>
            <option value="completed">Completed</option>
          </Select>
        </FormField>
        <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
          Day 14 now stages a real document center with signed-upload preparation, file previews, and status-aware filtering before OCR arrives.
        </div>
      </CardContent>
    </Card>
  );
}
