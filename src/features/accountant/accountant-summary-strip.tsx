import { StatCard } from "@/components/shared/stat-card";
import type { AccountantRequestSummary } from "@/types/finance";

type AccountantSummaryStripProps = {
  summary: AccountantRequestSummary;
};

export function AccountantSummaryStrip({ summary }: AccountantSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Requests"
        value={String(summary.totalRequests)}
        detail="All accountant service requests tracked in this workspace."
      />
      <StatCard
        label="Active"
        value={String(summary.activeCount)}
        detail="Requests still moving through qualification, scheduling, or live handling."
        delta={`${summary.newCount} new`}
        deltaTone="secondary"
      />
      <StatCard
        label="Scheduled"
        value={String(summary.scheduledCount)}
        detail="Requests with an active scheduling signal or confirmed next step."
      />
      <StatCard
        label="Urgent"
        value={String(summary.urgentCount)}
        detail="High-urgency requests that should stay visible in the service funnel."
        delta={`${summary.completedCount} completed`}
        deltaTone="success"
      />
    </section>
  );
}
