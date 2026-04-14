import { BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppointmentRecord } from "@/types/finance";

type AppointmentNoticeCardProps = {
  appointment: AppointmentRecord | null;
};

export function AppointmentNoticeCard({ appointment }: AppointmentNoticeCardProps) {
  if (!appointment) {
    return (
      <Card className="rounded-[1.7rem]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Booking notice</p>
          <CardTitle className="mt-3">No booking selected</CardTitle>
          <CardDescription className="mt-2">
            Select an appointment to see confirmation, reschedule, or cancellation messaging here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.7rem] border-primary/15 bg-primary/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white p-3 text-primary shadow-sm">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Booking notice</p>
            <CardTitle className="mt-3">Confirmation and follow-up state</CardTitle>
            <CardDescription className="mt-2">{appointment.notificationMessage}</CardDescription>
            {appointment.meetingLink ? (
              <div className="mt-4">
                <Button asChild variant="secondary" size="sm">
                  <a href={appointment.meetingLink} target="_blank" rel="noreferrer">
                    Open meeting link
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
