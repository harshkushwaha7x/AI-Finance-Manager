import type {
  AccountantDocumentOption,
  AccountantPackageRecord,
  AccountantRequestRecord,
} from "@/types/finance";

export function formatAccountantStatus(status: AccountantRequestRecord["status"]) {
  switch (status) {
    case "qualified":
      return "Qualified";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "New";
  }
}

export function getAccountantStatusVariant(status: AccountantRequestRecord["status"]) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    case "scheduled":
      return "secondary" as const;
    case "in_progress":
      return "warning" as const;
    case "qualified":
      return "primary" as const;
    default:
      return "neutral" as const;
  }
}

export function getUrgencyVariant(urgency: AccountantRequestRecord["urgency"]) {
  if (urgency === "high") {
    return "danger" as const;
  }

  if (urgency === "low") {
    return "neutral" as const;
  }

  return "warning" as const;
}

export function formatUrgency(urgency: AccountantRequestRecord["urgency"]) {
  if (urgency === "high") {
    return "High urgency";
  }

  if (urgency === "low") {
    return "Low urgency";
  }

  return "Normal urgency";
}

export function getRequestTypeLabel(requestType: AccountantRequestRecord["requestType"]) {
  switch (requestType) {
    case "gst":
      return "GST review";
    case "bookkeeping":
      return "Bookkeeping";
    case "filing":
      return "Filing support";
    case "custom":
      return "Custom case";
    default:
      return "Consultation";
  }
}

export function buildStatusTimeline(status: AccountantRequestRecord["status"]) {
  const steps = [
    { id: "new", label: "Request received" },
    { id: "qualified", label: "Qualified" },
    { id: "scheduled", label: "Scheduled" },
    { id: "in_progress", label: "In progress" },
    { id: "completed", label: "Completed" },
  ] as const;
  const statusOrder: Record<AccountantRequestRecord["status"], number> = {
    new: 0,
    qualified: 1,
    scheduled: 2,
    in_progress: 3,
    completed: 4,
    cancelled: 0,
  };
  const currentIndex = statusOrder[status];

  return steps.map((step, index) => ({
    ...step,
    state:
      status === "cancelled"
        ? index === 0
          ? "complete"
          : "cancelled"
        : index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "current"
            : "upcoming",
  }));
}

export function sortDocumentsForSelection(documents: AccountantDocumentOption[]) {
  return [...documents].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function buildPackageHighlights(packageRecord: AccountantPackageRecord) {
  const packageKeywordMap: Record<string, string[]> = {
    "starter-finance-health-check": ["Spending review", "Action plan", "Human guidance"],
    "freelancer-tax-and-invoice-setup": ["GST hygiene", "Invoice setup", "Freelancer workflow"],
    "monthly-bookkeeping-and-gst-support": [
      "Monthly bookkeeping",
      "GST support",
      "Recurring ops lane",
    ],
    "custom-consultation": ["Custom case", "Document review", "Priority triage"],
  };

  return packageKeywordMap[packageRecord.slug] ?? ["Finance support", "Document review", "Service lane"];
}
