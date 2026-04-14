import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAppointmentDateTime,
  formatAppointmentStatus,
  formatMeetingModeLabel,
  getAppointmentStatusVariant,
} from "@/features/bookings/booking-utils";
import type { AppointmentRecord } from "@/types/finance";

type AppointmentListPanelProps = {
  appointments: AppointmentRecord[];
  activeAppointmentId?: string | null;
  onSelect: (appointmentId: string) => void;
  onCreateNew: () => void;
};

export function AppointmentListPanel({
  appointments,
  activeAppointmentId,
  onSelect,
  onCreateNew,
}: AppointmentListPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Booking history</p>
            <CardTitle className="mt-3">Appointments linked to service requests</CardTitle>
            <CardDescription className="mt-2">
              Review scheduled consultations, reschedules, and past outcomes from one panel.
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={onCreateNew}>
            <CalendarClock className="h-4 w-4" />
            New booking
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length ? (
          appointments.map((appointment) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelect(appointment.id)}
              className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                appointment.id === activeAppointmentId
                  ? "border-primary/30 bg-primary/6 shadow-sm"
                  : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{appointment.requestLabel}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {formatAppointmentDateTime(appointment.scheduledFor)} / {formatMeetingModeLabel(appointment.meetingMode)}
                  </p>
                </div>
                <Badge variant={getAppointmentStatusVariant(appointment.status)}>
                  {formatAppointmentStatus(appointment.status)}
                </Badge>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            No appointments yet. Create the first consultation slot from this page.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
