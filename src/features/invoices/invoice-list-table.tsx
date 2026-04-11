import { PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceStatus,
  getInvoiceStatusVariant,
} from "@/features/invoices/invoice-utils";
import type { InvoiceRecord } from "@/types/finance";

type InvoiceListTableProps = {
  invoices: InvoiceRecord[];
  activeInvoiceId?: string;
  onSelect: (invoice: InvoiceRecord) => void;
  onEdit: (invoice: InvoiceRecord) => void;
  onDelete: (invoice: InvoiceRecord) => void;
};

export function InvoiceListTable({
  invoices,
  activeInvoiceId,
  onSelect,
  onEdit,
  onDelete,
}: InvoiceListTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-subtle text-muted">
          <tr>
            <th className="px-5 py-4 font-medium">Invoice</th>
            <th className="px-5 py-4 font-medium">Client</th>
            <th className="px-5 py-4 font-medium">Issue / due</th>
            <th className="px-5 py-4 font-medium">Total</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length ? (
            invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className={`border-t border-border ${activeInvoiceId === invoice.id ? "bg-primary/5" : ""}`}
              >
                <td className="px-5 py-4">
                  <button type="button" className="text-left" onClick={() => onSelect(invoice)}>
                    <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {invoice.items.length} item{invoice.items.length === 1 ? "" : "s"}
                    </p>
                  </button>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-foreground">{invoice.customerName}</p>
                  <p className="mt-1 text-xs leading-6 text-muted">
                    {invoice.customerEmail || invoice.customerGstin || "No secondary contact data"}
                  </p>
                </td>
                <td className="px-5 py-4 text-muted">
                  <p>{formatInvoiceDate(invoice.issueDate)}</p>
                  <p className="mt-1 text-xs">
                    {invoice.dueDate ? `Due ${formatInvoiceDate(invoice.dueDate)}` : "No due date"}
                  </p>
                </td>
                <td className="px-5 py-4 font-semibold text-foreground">
                  {formatInvoiceCurrency(invoice.totalAmount, invoice.currency)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                      {formatInvoiceStatus(invoice.status)}
                    </Badge>
                    {invoice.linkedIncomeTransactionId ? (
                      <Badge variant="success">Synced</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => onEdit(invoice)}>
                      <PencilLine className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(invoice)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-sm leading-7 text-muted">
                No invoices match the current filters yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
