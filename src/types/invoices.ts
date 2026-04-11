import type { InvoiceRecord, InvoiceSummary, InvoiceWorkspaceState } from "@/types/finance";

export type InvoiceSavedViewId =
  | "all"
  | "draft"
  | "sent"
  | "paid"
  | "overdue";

export type InvoiceSavedView = {
  id: InvoiceSavedViewId;
  label: string;
  description: string;
  count: number;
};

export type InvoicePageFilters = {
  search: string;
  status: "all" | InvoiceRecord["status"];
};

export type InvoiceWorkspaceViewState = {
  invoices: InvoiceRecord[];
  summary: InvoiceSummary;
  source: InvoiceWorkspaceState["source"];
};

export type InvoiceFormLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
};
