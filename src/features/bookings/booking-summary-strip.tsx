import { StatCard } from "@/components/shared/stat-card";
import type { AppointmentSummary } from "@/types/finance";

type BookingSummaryStripProps = {
  summary: AppointmentSummary;
};

export function BookingSummaryStrip({ summary }: BookingSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Bookings"
        value={String(summary.totalCount)}
        detail="Total appointment records connected to accountant service requests."
      />
      <StatCard
        label="Upcoming"
        value={String(summary.upcomingCount)}
        detail="Scheduled consultations that still need live attention."
        delta={`${summary.pendingCount} pending`}
        deltaTone="warning"
      />
      <StatCard
        label="Confirmed"
        value={String(summary.confirmedCount)}
        detail="Meetings with confirmed scheduling details and meeting context."
      />
      <StatCard
        label="Closed"
        value={String(summary.completedCount + summary.cancelledCount)}
        detail="Completed or cancelled booking outcomes already resolved."
        delta={`${summary.completedCount} completed`}
        deltaTone="success"
      />
    </section>
  );
}
