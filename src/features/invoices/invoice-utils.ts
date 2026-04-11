import type {
  InvoiceInput,
  InvoiceRecord,
  InvoiceSummary,
  TransactionRecord,
} from "@/types/finance";
import type { InvoicePageFilters, InvoiceSavedView, InvoiceSavedViewId } from "@/types/invoices";

function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

export function calculateInvoiceLineTotal(item: InvoiceInput["items"][number]) {
  return item.quantity * item.unitPrice;
}

export function calculateInvoiceLineTax(item: InvoiceInput["items"][number]) {
  return calculateInvoiceLineTotal(item) * (item.gstRate / 100);
}

export function calculateInvoiceTotals(items: InvoiceInput["items"]) {
  const subtotal = items.reduce((sum, item) => sum + calculateInvoiceLineTotal(item), 0);
  const taxAmount = items.reduce((sum, item) => sum + calculateInvoiceLineTax(item), 0);
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    totalAmount,
  };
}

export function getInvoiceDueInDays(dueDate?: string) {
  if (!dueDate) {
    return null;
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const today = getTodayStart();
  const diff = due.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getInvoiceStatus(
  status: InvoiceRecord["status"],
  dueDate?: string,
): InvoiceRecord["status"] {
  if (status === "paid" || status === "cancelled" || status === "draft") {
    return status;
  }

  const dueInDays = getInvoiceDueInDays(dueDate);

  if (typeof dueInDays === "number" && dueInDays < 0) {
    return "overdue";
  }

  return status;
}

export function getInvoiceStatusVariant(status: InvoiceRecord["status"]) {
  if (status === "paid") {
    return "success" as const;
  }

  if (status === "overdue") {
    return "danger" as const;
  }

  if (status === "sent") {
    return "warning" as const;
  }

  if (status === "cancelled") {
    return "neutral" as const;
  }

  return "secondary" as const;
}

export function formatInvoiceStatus(status: InvoiceRecord["status"]) {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "overdue") {
    return "Overdue";
  }

  if (status === "sent") {
    return "Sent";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Draft";
}

export function formatInvoiceCurrency(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInvoiceDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function createDefaultInvoiceNumber(existingInvoices: InvoiceRecord[]) {
  const year = new Date().getFullYear();
  const yearInvoices = existingInvoices.filter((invoice) =>
    invoice.invoiceNumber.includes(String(year)),
  );
  const nextSequence = String(yearInvoices.length + 1).padStart(3, "0");

  return `AFM-${year}-${nextSequence}`;
}

export function buildInvoiceSummary(invoices: InvoiceRecord[]): InvoiceSummary {
  return {
    totalInvoiceValue: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    paidValue: invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    outstandingValue: invoices
      .filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled")
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    overdueCount: invoices.filter((invoice) => invoice.status === "overdue").length,
    draftCount: invoices.filter((invoice) => invoice.status === "draft").length,
    paidCount: invoices.filter((invoice) => invoice.status === "paid").length,
  };
}

export function sortInvoicesForWorkspace(invoices: InvoiceRecord[]) {
  const statusOrder: Record<InvoiceRecord["status"], number> = {
    overdue: 0,
    sent: 1,
    draft: 2,
    paid: 3,
    cancelled: 4,
  };

  return [...invoices].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return right.issueDate.localeCompare(left.issueDate);
  });
}

export function buildInvoiceSavedViews(invoices: InvoiceRecord[]): InvoiceSavedView[] {
  return [
    {
      id: "all",
      label: "All invoices",
      description: "Every invoice tracked in the workspace.",
      count: invoices.length,
    },
    {
      id: "draft",
      label: "Drafts",
      description: "Invoices still being prepared.",
      count: invoices.filter((invoice) => invoice.status === "draft").length,
    },
    {
      id: "sent",
      label: "Sent",
      description: "Invoices waiting for payment.",
      count: invoices.filter((invoice) => invoice.status === "sent").length,
    },
    {
      id: "paid",
      label: "Paid",
      description: "Invoices already synced into revenue.",
      count: invoices.filter((invoice) => invoice.status === "paid").length,
    },
    {
      id: "overdue",
      label: "Overdue",
      description: "Invoices that need follow-up now.",
      count: invoices.filter((invoice) => invoice.status === "overdue").length,
    },
  ];
}

export function applyInvoiceSavedView(
  invoices: InvoiceRecord[],
  viewId: InvoiceSavedViewId,
) {
  if (viewId === "all") {
    return invoices;
  }

  return invoices.filter((invoice) => invoice.status === viewId);
}

export function applyInvoiceFilters(
  invoices: InvoiceRecord[],
  filters: InvoicePageFilters,
) {
  return invoices.filter((invoice) => {
    const matchesSearch = filters.search
      ? [
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.customerEmail,
          invoice.customerGstin,
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      : true;
    const matchesStatus =
      filters.status === "all" ? true : invoice.status === filters.status;

    return matchesSearch && matchesStatus;
  });
}

export function findLinkedInvoiceIncomeTransaction(
  invoiceId: string,
  transactions: TransactionRecord[],
) {
  const marker = `invoice-sync:${invoiceId}`;

  return (
    transactions.find(
      (transaction) =>
        transaction.source === "invoice" &&
        transaction.type === "income" &&
        (transaction.notes || "").includes(marker),
    ) ?? null
  );
}

export function buildInvoiceSyncNote(invoiceId: string, invoiceNumber: string) {
  return `invoice-sync:${invoiceId} | invoice-number:${invoiceNumber}`;
}

export function getDefaultInvoiceDate() {
  return formatDateString(new Date());
}

export function getDefaultInvoiceDueDate() {
  const value = new Date();
  value.setDate(value.getDate() + 14);

  return formatDateString(value);
}
