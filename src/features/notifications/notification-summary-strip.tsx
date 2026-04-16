import { MetricCard } from "@/components/dashboard/metric-card";
import type { NotificationSummary } from "@/types/finance";

type NotificationSummaryStripProps = {
  summary: NotificationSummary;
};

export function NotificationSummaryStrip({ summary }: NotificationSummaryStripProps) {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Unread"
        value={String(summary.unreadCount)}
        detail="Notifications still waiting on review or acknowledgement."
        deltaTone={summary.unreadCount > 0 ? "warning" : "success"}
      />
      <MetricCard
        label="Budget and goals"
        value={String(summary.budgetCount + summary.goalCount)}
        detail="Planning alerts pulled from live budget pressure and goal status."
      />
      <MetricCard
        label="Reports and AI"
        value={String(summary.reportCount + summary.systemCount)}
        detail="Fresh outputs and system-level finance review prompts."
      />
      <MetricCard
        label="Service updates"
        value={String(summary.serviceCount)}
        detail="Bookings and accountant workflow changes that need visibility."
      />
    </section>
  );
}
