import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAccountantStatus,
  formatUrgency,
  getAccountantStatusVariant,
  getRequestTypeLabel,
  getUrgencyVariant,
} from "@/features/accountant/accountant-utils";
import type { AccountantRequestRecord } from "@/types/finance";

type RequestListPanelProps = {
  requests: AccountantRequestRecord[];
  activeRequestId?: string | null;
  onSelect: (requestId: string) => void;
};

export function RequestListPanel({
  requests,
  activeRequestId,
  onSelect,
}: RequestListPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Request history</p>
        <CardTitle className="mt-3">Submitted service requests</CardTitle>
        <CardDescription className="mt-2">
          Review past submissions, keep the latest one selected, and make the service funnel feel operational.
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
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {request.packageLabel || getRequestTypeLabel(request.requestType)}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {getRequestTypeLabel(request.requestType)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getAccountantStatusVariant(request.status)}>
                    {formatAccountantStatus(request.status)}
                  </Badge>
                  <Badge variant={getUrgencyVariant(request.urgency)}>
                    {formatUrgency(request.urgency)}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted">{request.message}</p>
              <p className="mt-3 text-xs text-muted">
                Created {new Date(request.createdAt).toLocaleString("en-IN")}
              </p>
            </button>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            No accountant requests have been submitted yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
