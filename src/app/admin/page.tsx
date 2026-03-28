import { MetricCard } from "@/components/dashboard/metric-card";

const adminMetrics = [
  { label: "New leads", value: "18", detail: "Captured from marketing and dashboard service CTAs." },
  { label: "Qualified requests", value: "7", detail: "Requests ready for scheduling and follow-up." },
  { label: "Active packages", value: "4", detail: "Service offerings visible to end users." },
  { label: "Open follow-ups", value: "11", detail: "Admin actions still waiting on response or scheduling." },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-foreground p-8 text-white">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/55">Operations</p>
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
          Lightweight admin controls for a product-plus-service business.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">
          The admin surface makes the accountant service flow believable by showing how leads, requests,
          and package states can be managed without a separate internal app.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
    </div>
  );
}
