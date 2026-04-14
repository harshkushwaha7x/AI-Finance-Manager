import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildAppointmentTimeline,
  formatAppointmentDateTime,
  formatAppointmentStatus,
  formatMeetingModeLabel,
  getAppointmentStatusVariant,
} from "@/features/bookings/booking-utils";
import type { AccountantRequestRecord, AppointmentRecord } from "@/types/finance";

type AppointmentTimelinePanelProps = {
  appointment: AppointmentRecord | null;
  request: AccountantRequestRecord | null;
};

export function AppointmentTimelinePanel({
  appointment,
  request,
}: AppointmentTimelinePanelProps) {
  const timeline = buildAppointmentTimeline(appointment);

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Booking timeline</p>
            <CardTitle className="mt-3">
              {appointment?.requestLabel || request?.packageLabel || "Select an appointment"}
            </CardTitle>
            <CardDescription className="mt-2">
              Follow the booking from submission through confirmation and consultation completion.
            </CardDescription>
          </div>
          {appointment ? (
            <Badge variant={getAppointmentStatusVariant(appointment.status)}>
              {formatAppointmentStatus(appointment.status)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((item, index) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-3.5 w-3.5 rounded-full ${
                  item.state === "complete"
                    ? "bg-success"
                    : item.state === "current"
                      ? "bg-primary"
                      : item.state === "cancelled"
                        ? "bg-danger"
                        : "bg-border"
                }`}
              />
              {index < timeline.length - 1 ? <span className="mt-2 h-full w-px bg-border" /> : null}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                {item.state === "complete"
                  ? "This step is complete."
                  : item.state === "current"
                    ? "This is the active booking stage right now."
                    : item.state === "cancelled"
                      ? "The booking stopped before reaching this stage."
                      : "This stage has not happened yet."}
              </p>
            </div>
          </div>
        ))}

        {appointment ? (
          <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4 text-sm leading-7 text-muted">
            Scheduled for {formatAppointmentDateTime(appointment.scheduledFor)} via{" "}
            {formatMeetingModeLabel(appointment.meetingMode)}.
            {appointment.meetingLink ? ` Meeting link: ${appointment.meetingLink}` : " Meeting link is not attached yet."}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            Choose an appointment to inspect the timeline and booking details here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
