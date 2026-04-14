import { CheckCircle2, Circle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBookingChecklist } from "@/features/bookings/booking-utils";
import type { AccountantRequestRecord } from "@/types/finance";

type BookingChecklistPanelProps = {
  request: AccountantRequestRecord | null;
};

export function BookingChecklistPanel({ request }: BookingChecklistPanelProps) {
  const checklist = buildBookingChecklist(request);

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Pre-call checklist</p>
        <CardTitle className="mt-3">Make the consultation operationally ready</CardTitle>
        <CardDescription className="mt-2">
          Keep the intake clean before the meeting starts so the accountant is not walking in blind.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {request ? (
          checklist.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-[1.3rem] border border-border bg-surface-subtle p-4">
              <div className="mt-1 text-primary">
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            Select a request to see the checklist before booking.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
