"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { InvoiceFiltersPanel } from "@/features/invoices/invoice-filters-panel";
import { InvoiceFormDrawer } from "@/features/invoices/invoice-form-drawer";
import { InvoiceListTable } from "@/features/invoices/invoice-list-table";
import { InvoicePreviewCard } from "@/features/invoices/invoice-preview-card";
import { InvoiceSavedViews } from "@/features/invoices/invoice-saved-views";
import { InvoiceSummaryStrip } from "@/features/invoices/invoice-summary-strip";
import {
  applyInvoiceFilters,
  applyInvoiceSavedView,
  buildInvoiceSavedViews,
  buildInvoiceSummary,
} from "@/features/invoices/invoice-utils";
import type { InvoiceInput, InvoiceRecord, InvoiceWorkspaceState } from "@/types/finance";
import type { InvoicePageFilters, InvoiceSavedViewId } from "@/types/invoices";

type InvoicesWorkspaceProps = {
  initialState: InvoiceWorkspaceState;
};

type InvoiceMutationPayload = {
  ok?: boolean;
  message?: string;
  invoice?: InvoiceRecord;
  invoices?: InvoiceRecord[];
  summary?: InvoiceWorkspaceState["summary"];
  source?: InvoiceWorkspaceState["source"];
};

const defaultFilters: InvoicePageFilters = {
  search: "",
  status: "all",
};

export function InvoicesWorkspace({ initialState }: InvoicesWorkspaceProps) {
  const [invoices, setInvoices] = useState(initialState.invoices);
  const [workspaceSource, setWorkspaceSource] = useState(initialState.source);
  const [filters, setFilters] = useState<InvoicePageFilters>(defaultFilters);
  const [activeView, setActiveView] = useState<InvoiceSavedViewId>("all");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(
    initialState.invoices[0]?.id ?? null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const summary = useMemo(() => buildInvoiceSummary(invoices), [invoices]);
  const savedViews = useMemo(() => buildInvoiceSavedViews(invoices), [invoices]);
  const visibleInvoices = useMemo(
    () => applyInvoiceFilters(applyInvoiceSavedView(invoices, activeView), filters),
    [activeView, filters, invoices],
  );
  const activeInvoice =
    invoices.find((invoice) => invoice.id === activeInvoiceId) ?? visibleInvoices[0] ?? null;

  function syncWorkspace(
    nextInvoices: InvoiceRecord[],
    nextSource?: InvoiceWorkspaceState["source"],
  ) {
    setInvoices(nextInvoices);
    setWorkspaceSource(nextSource ?? workspaceSource);
    setActiveInvoiceId((current) => {
      if (current && nextInvoices.some((invoice) => invoice.id === current)) {
        return current;
      }

      return nextInvoices[0]?.id ?? null;
    });
  }

  async function handleCreateOrUpdate(values: InvoiceInput) {
    const isEdit = drawerMode === "edit" && editingInvoice;
    const url = isEdit ? `/api/invoices/${editingInvoice.id}` : "/api/invoices";
    const method = isEdit ? "PATCH" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as InvoiceMutationPayload;

    if (!response.ok || !payload.invoices) {
      throw new Error(payload.message ?? "Unable to save invoice.");
    }

    syncWorkspace(payload.invoices, payload.source);
    setActiveInvoiceId(payload.invoice?.id ?? payload.invoices[0]?.id ?? null);
    setIsDrawerOpen(false);
    setEditingInvoice(null);
    toast.success(isEdit ? "Invoice updated." : "Invoice created.");
  }

  async function handleDelete(invoice: InvoiceRecord) {
    try {
      setDeletingInvoiceId(invoice.id);
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as InvoiceMutationPayload;

      if (!response.ok || !payload.invoices) {
        throw new Error(payload.message ?? "Unable to delete invoice.");
      }

      syncWorkspace(payload.invoices, payload.source);
      toast.success("Invoice deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete invoice.";
      toast.error(message);
    } finally {
      setDeletingInvoiceId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Invoices"
        title="Run invoicing as part of the finance operating system"
        description="Compose GST-aware invoices, track paid vs outstanding value, and sync paid collections back into the income workflow without leaving the dashboard."
        badge={workspaceSource === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setDrawerMode("create");
              setEditingInvoice(null);
              setIsDrawerOpen(true);
            }}
          >
            Create invoice
          </Button>
        }
      />

      <InvoiceSummaryStrip summary={summary} />
      <InvoiceSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <InvoiceFiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="space-y-6">
          <InvoiceListTable
            invoices={visibleInvoices}
            activeInvoiceId={activeInvoice?.id}
            onSelect={(invoice) => setActiveInvoiceId(invoice.id)}
            onEdit={(invoice) => {
              setDrawerMode("edit");
              setEditingInvoice(invoice);
              setIsDrawerOpen(true);
            }}
            onDelete={(invoice) => {
              void handleDelete(invoice);
            }}
          />
          {deletingInvoiceId ? (
            <p className="text-sm leading-7 text-muted">
              Removing invoice and any synced income record...
            </p>
          ) : null}
        </div>
        <InvoicePreviewCard invoice={activeInvoice} />
      </section>

      <InvoiceFormDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        invoices={invoices}
        initialInvoice={editingInvoice}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);

          if (!open) {
            setEditingInvoice(null);
          }
        }}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
}
