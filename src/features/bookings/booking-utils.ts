import { getRequestTypeLabel } from "@/features/accountant/accountant-utils";
import type { BookingChecklistItem } from "@/types/bookings";
import type { AccountantRequestRecord, AppointmentRecord } from "@/types/finance";

export function formatAppointmentStatus(status: AppointmentRecord["status"]) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rescheduled":
      return "Rescheduled";
    default:
      return "Pending";
  }
}

export function getAppointmentStatusVariant(status: AppointmentRecord["status"]) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "completed":
      return "primary" as const;
    case "cancelled":
      return "danger" as const;
    case "rescheduled":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export function formatMeetingModeLabel(mode: AppointmentRecord["meetingMode"]) {
  if (mode === "phone") {
    return "Phone";
  }

  if (mode === "onsite") {
    return "Onsite";
  }

  return "Google Meet";
}

export function formatAppointmentDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return "";
  }

  const nextValue = new Date(value);
  const year = nextValue.getFullYear();
  const month = String(nextValue.getMonth() + 1).padStart(2, "0");
  const day = String(nextValue.getDate()).padStart(2, "0");
  const hour = String(nextValue.getHours()).padStart(2, "0");
  const minute = String(nextValue.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function buildBookingChecklist(
  request: AccountantRequestRecord | null,
): BookingChecklistItem[] {
  if (!request) {
    return [];
  }

  const needsGstin = ["gst", "bookkeeping", "filing"].includes(request.requestType);

  return [
    {
      id: "workspace",
      label: "Workspace context captured",
      description: request.context.workspaceName
        ? `Ready under ${request.context.workspaceName}.`
        : "Add a workspace or business label before the consultation starts.",
      completed: Boolean(request.context.workspaceName),
    },
    {
      id: "documents",
      label: "Supporting documents attached",
      description: request.context.documentNames.length
        ? `${request.context.documentNames.length} document(s) attached for review.`
        : "Attach receipts, invoices, or tax files so the accountant has context before the call.",
      completed: request.context.documentNames.length > 0,
    },
    {
      id: "schedule",
      label: "Preferred time shared",
      description: request.preferredDate
        ? `Preferred slot recorded for ${formatAppointmentDateTime(request.preferredDate)}.`
        : "No preferred slot captured yet. Use the scheduler to pick a consultation time.",
      completed: Boolean(request.preferredDate),
    },
    {
      id: "gstin",
      label: needsGstin ? "GSTIN ready for review" : "Tax identifier optional",
      description: needsGstin
        ? request.context.gstin
          ? `GSTIN available: ${request.context.gstin}.`
          : "Add GSTIN before the consultation if the request is GST or filing related."
        : "This request can still be booked without a GSTIN.",
      completed: needsGstin ? Boolean(request.context.gstin) : true,
    },
  ];
}

export function buildAppointmentTimeline(appointment: AppointmentRecord | null) {
  const steps = [
    { id: "pending", label: "Booking submitted" },
    { id: "confirmed", label: "Confirmed" },
    { id: "completed", label: "Consultation completed" },
  ] as const;

  if (!appointment) {
    return steps.map((step) => ({
      ...step,
      state: "upcoming" as const,
    }));
  }

  if (appointment.status === "cancelled") {
    return steps.map((step, index) => ({
      ...step,
      state: index === 0 ? ("complete" as const) : ("cancelled" as const),
    }));
  }

  const currentIndex =
    appointment.status === "pending"
      ? 0
      : appointment.status === "confirmed" || appointment.status === "rescheduled"
        ? 1
        : 2;

  return steps.map((step, index) => ({
    ...step,
    state:
      index < currentIndex ? ("complete" as const) : index === currentIndex ? ("current" as const) : ("upcoming" as const),
  }));
}

export function getRequestBookingLabel(request: AccountantRequestRecord) {
  return request.packageLabel || getRequestTypeLabel(request.requestType);
}
