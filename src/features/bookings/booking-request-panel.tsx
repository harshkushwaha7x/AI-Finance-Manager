import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAccountantStatus,
  getAccountantStatusVariant,
  getUrgencyVariant,
} from "@/features/accountant/accountant-utils";
import { formatAppointmentDateTime, getRequestBookingLabel } from "@/features/bookings/booking-utils";
import type { AccountantRequestRecord } from "@/types/finance";

type BookingRequestPanelProps = {
  requests: AccountantRequestRecord[];
  activeRequestId?: string | null;
  onSelect: (requestId: string) => void;
};

export function BookingRequestPanel({
  requests,
  activeRequestId,
  onSelect,
}: BookingRequestPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Request selection</p>
        <CardTitle className="mt-3">Choose the request you want to book against</CardTitle>
        <CardDescription className="mt-2">
          Every booking stays tied to a real accountant request so service status, documents, and follow-through stay connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length ? (
          requests.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => onSelect(request.id)}
              className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                request.id === activeRequestId
                  ? "border-primary/30 bg-primary/6 shadow-sm"
                  : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{getRequestBookingLabel(request)}</p>
                  <p className="mt-2 text-sm leading-7 text-muted">{request.message}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getAccountantStatusVariant(request.status)}>
                    {formatAccountantStatus(request.status)}
                  </Badge>
                  <Badge variant={getUrgencyVariant(request.urgency)}>
                    {request.urgency}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                <span>
                  {request.preferredDate
                    ? `Preferred slot: ${formatAppointmentDateTime(request.preferredDate)}`
                    : "No preferred slot yet"}
                </span>
                <span>{request.context.documentNames.length} supporting docs</span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            Submit an accountant request first, then schedule the consultation here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
