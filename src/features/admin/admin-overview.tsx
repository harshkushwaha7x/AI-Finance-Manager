import Link from "next/link";

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
import { siteConfig } from "@/lib/constants/site";
import type { AdminOverviewState } from "@/types/admin";

import {
  formatAdminDate,
  formatRequestTypeLabel,
  getRequestStatusBadgeVariant,
  getUrgencyBadgeVariant,
} from "./admin-utils";

type AdminOverviewProps = {
  state: AdminOverviewState;
};

export function AdminOverview({ state }: AdminOverviewProps) {
  const topRequests = state.requests.slice(0, 4);
  const topLeads = state.leads.slice(0, 4);
  const activePackages = state.packages.filter((item) => item.isActive);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin overview"
        title="Run the service side like a real startup ops console"
        description="This admin surface now tracks lead capture, request pipeline health, live packages, and next follow-ups so the accountant module feels operationally credible."
        badge={state.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/admin/leads">Open leads inbox</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/packages">Manage packages</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="New leads"
          value={String(state.metrics.newLeads)}
          detail="Leads captured from marketing contact and service-driven entry points."
          delta={state.leads[0] ? `Latest ${formatAdminDate(state.leads[0].createdAt)}` : undefined}
        />
        <MetricCard
          label="Qualified requests"
          value={String(state.metrics.qualifiedRequests)}
          detail="Requests ready for scheduling or active follow-up."
          delta={`${Math.max(state.metrics.qualifiedRequests - state.metrics.scheduledConsultations, 0)} waiting`}
          deltaTone="warning"
        />
        <MetricCard
          label="Active packages"
          value={String(state.metrics.activePackages)}
          detail="Service packages currently visible to the user-facing accountant lane."
        />
        <MetricCard
          label="Open follow-ups"
          value={String(state.metrics.openFollowUps)}
          detail="Lead or request conversations that still need a manual next step."
          deltaTone="warning"
        />
        <MetricCard
          label="Scheduled consults"
          value={String(state.metrics.scheduledConsultations)}
          detail="Confirmed or upcoming consultations already connected to the service flow."
          deltaTone="success"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader className="space-y-6">
            <SectionToolbar
              title="Request pipeline"
              description="Recent accountant requests with enough context for fast qualification, assignment, or scheduling."
              actions={
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/admin/leads">Review all requests</Link>
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {topRequests.length ? (
              topRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5"
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
                        {request.urgency} urgency
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">{request.message}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                    <span>{formatRequestTypeLabel(request.requestType)}</span>
                    <span>Updated {formatAdminDate(request.updatedAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No requests yet</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Once users submit service forms, they will appear here with status, urgency, and notes-ready context.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Lead intake snapshot</CardTitle>
            <CardDescription>
              Marketing and support demand stays visible so product and service conversations do not drift apart.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {topLeads.length ? (
              topLeads.map((lead) => (
                <div key={lead.id} className="rounded-[1.4rem] border border-black/6 bg-background p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {lead.company || "Independent inquiry"} · {lead.interest}
                      </p>
                    </div>
                    <Badge variant="neutral">{formatAdminDate(lead.createdAt)}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">{lead.message}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No lead activity yet</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Contact form submissions will populate this panel and flow into the leads inbox.
                </p>
              </div>
            )}

            <div className="rounded-[1.5rem] border border-black/6 bg-foreground p-6 text-white">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/55">
                Package visibility
              </p>
              <p className="mt-4 font-display text-3xl font-bold tracking-tight">
                {activePackages.length} live package{activePackages.length === 1 ? "" : "s"}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Active offers currently shown to visitors and dashboard users inside {siteConfig.name}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activePackages.slice(0, 3).map((pkg) => (
                  <Badge key={pkg.id} variant="secondary" className="bg-white/10 text-white">
                    {pkg.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
