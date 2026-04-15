"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminLeadWorkspaceState } from "@/types/admin";
import type {
  AccountantRequestRecord,
  AccountantRequestStatus,
} from "@/types/finance";

import {
  formatAdminDate,
  formatRequestTypeLabel,
  getRequestStatusBadgeVariant,
  getUrgencyBadgeVariant,
} from "./admin-utils";

type AdminRequestMutationPayload = {
  ok?: boolean;
  message?: string;
  request?: AccountantRequestRecord;
  requests?: AccountantRequestRecord[];
  source?: AdminLeadWorkspaceState["source"];
};

type AdminLeadsWorkspaceProps = {
  initialState: AdminLeadWorkspaceState;
};

export function AdminLeadsWorkspace({ initialState }: AdminLeadsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountantRequestStatus>("all");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    initialState.requests[0]?.id ?? null,
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    initialState.leads[0]?.id ?? null,
  );
  const [draftStatus, setDraftStatus] = useState<AccountantRequestStatus>("new");
  const [draftNotes, setDraftNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredRequests = useMemo(() => {
    return workspaceState.requests.filter((request) => {
      const matchesSearch = [request.packageLabel, request.message, request.context.workspaceName]
        .join(" ")
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchValue, statusFilter, workspaceState.requests]);

  const filteredLeads = useMemo(() => {
    return workspaceState.leads.filter((lead) =>
      [lead.name, lead.company, lead.interest, lead.message, lead.email]
        .join(" ")
        .toLowerCase()
        .includes(searchValue.toLowerCase()),
    );
  }, [searchValue, workspaceState.leads]);

  const activeRequest = useMemo(
    () =>
      workspaceState.requests.find((request) => request.id === selectedRequestId) ??
      workspaceState.requests[0] ??
      null,
    [selectedRequestId, workspaceState.requests],
  );
  const activeLead = useMemo(
    () =>
      workspaceState.leads.find((lead) => lead.id === selectedLeadId) ??
      workspaceState.leads[0] ??
      null,
    [selectedLeadId, workspaceState.leads],
  );

  useEffect(() => {
    if (!activeRequest) {
      return;
    }

    setDraftStatus(activeRequest.status);
    setDraftNotes(activeRequest.adminNotes || "");
  }, [activeRequest]);

  async function handleSaveRequest() {
    if (!activeRequest) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: draftStatus,
          adminNotes: draftNotes,
        }),
      });
      const payload = (await response.json()) as AdminRequestMutationPayload;

      if (!response.ok || !payload.requests) {
        throw new Error(payload.message ?? "Unable to update the request.");
      }

      setWorkspaceState((current) => ({
        ...current,
        requests: payload.requests ?? current.requests,
        source: payload.source ?? current.source,
      }));
      toast.success("Request status and admin notes updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin leads"
        title="Keep demand and delivery visible in one inbox"
        description="This workspace turns inbound contact leads and accountant requests into something an operator can triage, qualify, and move forward without leaving the product."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Contact leads"
          value={String(workspaceState.leads.length)}
          detail="Marketing and support conversations captured through the public-facing contact flow."
        />
        <MetricCard
          label="Open requests"
          value={String(workspaceState.requests.filter((item) => item.status !== "completed").length)}
          detail="Service requests still moving through qualification, scheduling, or execution."
          deltaTone="warning"
        />
        <MetricCard
          label="High urgency"
          value={String(workspaceState.requests.filter((item) => item.urgency === "high").length)}
          detail="Requests that need faster admin attention or tighter follow-up."
          deltaTone="danger"
        />
        <MetricCard
          label="Scheduled now"
          value={String(workspaceState.requests.filter((item) => item.status === "scheduled").length)}
          detail="Requests already ready to hand off into the booking workflow."
          deltaTone="success"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <Card>
          <CardHeader className="space-y-6">
            <SectionToolbar
              title="Request inbox"
              description="Search, status filter, and pick the request that needs the next admin action."
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search workspace, package, or message"
              />
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AccountantRequestStatus)
                }
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredRequests.length ? (
              filteredRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedRequestId(request.id)}
                  className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                    request.id === activeRequest?.id
                      ? "border-primary/35 bg-primary/6"
                      : "border-black/6 bg-surface-subtle hover:border-primary/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold tracking-tight text-foreground">
                        {request.packageLabel || formatRequestTypeLabel(request.requestType)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {request.context.workspaceName || "Finance workspace"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getRequestStatusBadgeVariant(request.status)}>
                        {request.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant={getUrgencyBadgeVariant(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-muted">{request.message}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No requests match</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Try widening the search or resetting the current status filter.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Request detail</CardTitle>
            <CardDescription>
              Update status, capture internal notes, and keep the next action obvious for anyone handling ops.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRequest ? (
              <div className="space-y-6">
                <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                        {activeRequest.packageLabel || formatRequestTypeLabel(activeRequest.requestType)}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {activeRequest.context.workspaceName || "Finance workspace"} · Updated{" "}
                        {formatAdminDate(activeRequest.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getRequestStatusBadgeVariant(activeRequest.status)}>
                        {activeRequest.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant={getUrgencyBadgeVariant(activeRequest.urgency)}>
                        {activeRequest.urgency} urgency
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">{activeRequest.message}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {activeRequest.context.documentNames.length ? (
                      activeRequest.context.documentNames.map((name) => (
                        <Badge key={name} variant="neutral">
                          {name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="neutral">No attached documents</Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Status" htmlFor="admin-request-status">
                    <Select
                      id="admin-request-status"
                      value={draftStatus}
                      onChange={(event) =>
                        setDraftStatus(event.target.value as AccountantRequestStatus)
                      }
                    >
                      <option value="new">New</option>
                      <option value="qualified">Qualified</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FormField>
                  <div className="rounded-[1.4rem] border border-black/6 bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">Request context</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Type: {formatRequestTypeLabel(activeRequest.requestType)}
                      <br />
                      Preferred date:{" "}
                      {activeRequest.preferredDate
                        ? formatAdminDate(activeRequest.preferredDate)
                        : "Not provided"}
                      <br />
                      GSTIN: {activeRequest.context.gstin || "Not shared"}
                    </p>
                  </div>
                </div>

                <FormField
                  label="Admin notes"
                  htmlFor="admin-request-notes"
                  hint="Keep internal follow-up notes short and operational."
                >
                  <Textarea
                    id="admin-request-notes"
                    className="min-h-36"
                    value={draftNotes}
                    onChange={(event) => setDraftNotes(event.target.value)}
                    placeholder="Add scheduling context, qualification details, or what the team should do next."
                  />
                </FormField>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveRequest} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save request update"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!activeRequest) {
                        return;
                      }

                      setDraftStatus(activeRequest.status);
                      setDraftNotes(activeRequest.adminNotes || "");
                    }}
                  >
                    Reset draft
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">Pick a request</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Select a request from the inbox to update status and keep ops moving.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-6">
          <SectionToolbar
            title="Lead pipeline"
            description="Inbound leads from the public contact flow with enough context for a fast first response."
          />
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-4">
            {filteredLeads.length ? (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                    lead.id === activeLead?.id
                      ? "border-secondary/30 bg-secondary/6"
                      : "border-black/6 bg-surface-subtle hover:border-secondary/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {lead.company || "Independent inquiry"} · {lead.interest}
                      </p>
                    </div>
                    <Badge variant="neutral">{formatAdminDate(lead.createdAt)}</Badge>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-muted">{lead.message}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No leads match</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Contact leads will appear here once visitors submit inquiries.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-black/6 bg-background p-6">
            {activeLead ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                      {activeLead.name}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activeLead.email}</p>
                  </div>
                  <Badge variant="secondary">{activeLead.interest}</Badge>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Company</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {activeLead.company || "Not provided"}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Source</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activeLead.source}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
                  <p className="text-sm font-semibold text-foreground">Inquiry</p>
                  <p className="mt-3 text-sm leading-7 text-muted">{activeLead.message}</p>
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-bold text-foreground">Pick a lead</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Select a lead from the left to review the full inquiry context.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
