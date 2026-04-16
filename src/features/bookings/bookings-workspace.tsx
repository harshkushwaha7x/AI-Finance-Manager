"use client";

import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BookingChecklistPanel } from "@/features/bookings/booking-checklist-panel";
import { BookingRequestPanel } from "@/features/bookings/booking-request-panel";
import { BookingSummaryStrip } from "@/features/bookings/booking-summary-strip";
import { AppointmentListPanel } from "@/features/bookings/appointment-list-panel";
import { AppointmentNoticeCard } from "@/features/bookings/appointment-notice-card";
import { AppointmentSchedulerCard } from "@/features/bookings/appointment-scheduler-card";
import { AppointmentTimelinePanel } from "@/features/bookings/appointment-timeline-panel";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type { BookingSchedulerMode } from "@/types/bookings";
import type {
  AccountantRequestRecord,
  AppointmentInput,
  AppointmentRecord,
  AppointmentUpdateInput,
  BookingWorkspaceState,
} from "@/types/finance";

type BookingMutationPayload = {
  ok?: boolean;
  message?: string;
  appointment?: AppointmentRecord;
  appointments?: AppointmentRecord[];
  requests?: AccountantRequestRecord[];
  summary?: BookingWorkspaceState["summary"];
  source?: BookingWorkspaceState["source"];
};

type BookingsWorkspaceProps = {
  initialState: BookingWorkspaceState;
};

function getInitialRequestId(state: BookingWorkspaceState) {
  return state.requests[0]?.id ?? null;
}

export function BookingsWorkspace({ initialState }: BookingsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    getInitialRequestId(initialState),
  );
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(
    initialState.appointments[0]?.id ?? null,
  );
  const [schedulerMode, setSchedulerMode] = useState<BookingSchedulerMode>(
    initialState.appointments.length ? "edit" : "create",
  );
  const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentRecord | null>(null);

  const selectedRequest = useMemo(
    () =>
      workspaceState.requests.find((request) => request.id === selectedRequestId) ??
      workspaceState.requests[0] ??
      null,
    [selectedRequestId, workspaceState.requests],
  );
  const activeAppointment = useMemo(
    () =>
      workspaceState.appointments.find((appointment) => appointment.id === activeAppointmentId) ??
      null,
    [activeAppointmentId, workspaceState.appointments],
  );

  function applyMutationPayload(payload: BookingMutationPayload) {
    if (!payload.appointments || !payload.requests || !payload.summary) {
      throw new Error(payload.message ?? "Booking workspace update failed.");
    }

    setWorkspaceState((current) => ({
      appointments: payload.appointments ?? current.appointments,
      requests: payload.requests ?? current.requests,
      summary: payload.summary ?? current.summary,
      source: payload.source ?? current.source,
    }));
  }

  async function createBooking(values: AppointmentInput) {
    const response = await fetch("/api/accountant/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as BookingMutationPayload;

    if (!response.ok || !payload.appointment) {
      throw new Error(payload.message ?? "Unable to create the booking.");
    }

    applyMutationPayload(payload);
    setSelectedRequestId(payload.appointment.requestId);
    setActiveAppointmentId(payload.appointment.id);
    setSchedulerMode("edit");
    emitNotificationsChanged();
    toast.success("Booking created and linked to the accountant request.");
  }

  async function updateBooking(appointmentId: string, values: AppointmentUpdateInput) {
    const response = await fetch(`/api/accountant/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as BookingMutationPayload;

    if (!response.ok || !payload.appointment) {
      throw new Error(payload.message ?? "Unable to update the booking.");
    }

    applyMutationPayload(payload);
    setSelectedRequestId(payload.appointment.requestId);
    setActiveAppointmentId(payload.appointment.id);
    setSchedulerMode("edit");
    emitNotificationsChanged();
    toast.success(payload.appointment.notificationMessage || "Booking updated.");
  }

  async function handleSchedulerSubmit(values: AppointmentInput) {
    try {
      if (schedulerMode === "edit" && activeAppointment) {
        await updateBooking(activeAppointment.id, values);
      } else {
        await createBooking(values);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  async function handleCancelAppointment() {
    if (!appointmentToCancel) {
      return;
    }

    try {
      await updateBooking(appointmentToCancel.id, {
        status: "cancelled",
      });
      setAppointmentToCancel(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bookings"
        title="Schedule accountant consultations cleanly"
        description="The bookings workspace now supports slot selection, request-linked scheduling, admin-style confirmation details, and reschedule or cancellation flows in one place."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSchedulerMode("create");
                setActiveAppointmentId(null);
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              New booking
            </Button>
            {activeAppointment ? (
              <Button variant="secondary" onClick={() => setAppointmentToCancel(activeAppointment)}>
                Cancel selected
              </Button>
            ) : null}
          </div>
        }
      />

      <BookingSummaryStrip summary={workspaceState.summary} />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <BookingRequestPanel
          requests={workspaceState.requests}
          activeRequestId={selectedRequest?.id ?? null}
          onSelect={(requestId) => {
            setSelectedRequestId(requestId);
            if (schedulerMode === "create") {
              setActiveAppointmentId(null);
            }
          }}
        />
        <AppointmentSchedulerCard
          mode={schedulerMode}
          requests={workspaceState.requests}
          selectedRequestId={selectedRequest?.id ?? null}
          activeAppointment={activeAppointment}
          onSelectRequest={setSelectedRequestId}
          onSubmit={handleSchedulerSubmit}
          onResetMode={() => {
            setSchedulerMode("create");
            setActiveAppointmentId(null);
          }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <AppointmentNoticeCard appointment={activeAppointment} />
        <BookingChecklistPanel request={selectedRequest} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AppointmentListPanel
          appointments={workspaceState.appointments}
          activeAppointmentId={activeAppointment?.id ?? null}
          onSelect={(appointmentId) => {
            const appointment = workspaceState.appointments.find(
              (candidate) => candidate.id === appointmentId,
            );

            setActiveAppointmentId(appointmentId);
            setSelectedRequestId(appointment?.requestId ?? selectedRequest?.id ?? null);
            setSchedulerMode("edit");
          }}
          onCreateNew={() => {
            setSchedulerMode("create");
            setActiveAppointmentId(null);
          }}
        />
        <AppointmentTimelinePanel appointment={activeAppointment} request={selectedRequest} />
      </div>

      <ConfirmDialog
        open={Boolean(appointmentToCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setAppointmentToCancel(null);
          }
        }}
        title="Cancel this booking?"
        description="This keeps the appointment in history but marks it as cancelled and updates the request-linked booking state."
        confirmLabel="Cancel booking"
        tone="danger"
        onConfirm={handleCancelAppointment}
      />
    </div>
  );
}
