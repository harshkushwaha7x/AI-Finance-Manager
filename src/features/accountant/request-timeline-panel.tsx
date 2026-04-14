import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildStatusTimeline,
  formatAccountantStatus,
  getAccountantStatusVariant,
  getRequestTypeLabel,
} from "@/features/accountant/accountant-utils";
import type { AccountantRequestRecord } from "@/types/finance";

type RequestTimelinePanelProps = {
  request: AccountantRequestRecord | null;
};

export function RequestTimelinePanel({ request }: RequestTimelinePanelProps) {
  if (!request) {
    return (
      <Card className="rounded-[1.7rem]">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Timeline</p>
          <CardTitle className="mt-3">No request selected</CardTitle>
          <CardDescription className="mt-2">
            Submit or select a request to see the service status timeline here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const timeline = buildStatusTimeline(request.status);

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Timeline</p>
            <CardTitle className="mt-3">{request.packageLabel || getRequestTypeLabel(request.requestType)}</CardTitle>
            <CardDescription className="mt-2">
              Current status: {formatAccountantStatus(request.status)}
            </CardDescription>
          </div>
          <Badge variant={getAccountantStatusVariant(request.status)}>
            {formatAccountantStatus(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((item) => (
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
              {item !== timeline[timeline.length - 1] ? (
                <span className="mt-2 h-full w-px bg-border" />
              ) : null}
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm leading-7 text-muted">
                {item.state === "complete"
                  ? "This step is complete."
                  : item.state === "current"
                    ? "This is the active stage right now."
                    : item.state === "cancelled"
                      ? "This request stopped before reaching this step."
                      : "This stage comes later in the service flow."}
              </p>
            </div>
          </div>
        ))}
        <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
          <p className="text-sm font-semibold text-foreground">Attached context</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            {request.context.documentNames.length
              ? request.context.documentNames.join(", ")
              : "No document context attached to this request yet."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
