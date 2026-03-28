import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { dashboardActivities, dashboardSnapshot } from "@/lib/constants/site";

const metricCards = [
  {
    label: "Cash in",
    value: dashboardSnapshot.revenue,
    detail: "Combined revenue and retained income snapshot for the month.",
  },
  {
    label: "Cash out",
    value: dashboardSnapshot.spend,
    detail: "Expense volume across operations, subscriptions, and tax buckets.",
  },
  {
    label: "Runway",
    value: dashboardSnapshot.runway,
    detail: "A simple portfolio-friendly metric to show future planning intent.",
  },
  {
    label: "Budget health",
    value: dashboardSnapshot.budgetHealth,
    detail: "Early warning surface for overspend and category pressure.",
  },
];

const quickActions = [
  "Add a new transaction",
  "Upload a receipt or invoice",
  "Generate AI insights",
  "Request accountant support",
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-foreground p-8 text-white shadow-[0_30px_90px_-60px_rgba(17,24,39,0.8)]">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Overview</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            A polished control tower for finance, AI, and services.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/76">
            This route establishes the visual system for upcoming charts, widgets, and data-backed cards
            without waiting for every backend dependency to land first.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {quickActions.map((item) => (
              <Button key={item} variant="secondary" className="border-white/12 bg-white/8 text-white hover:bg-white/12">
                {item}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/6 bg-surface p-7">
          <p className="font-display text-2xl font-bold text-foreground">Build signal</p>
          <div className="mt-6 space-y-4">
            {dashboardActivities.map((activity) => (
              <div
                key={activity}
                className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted"
              >
                {activity}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.8rem] border border-black/6 bg-surface p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-foreground">Cash flow trend preview</p>
              <p className="mt-2 text-sm leading-7 text-muted">
                Static bars for now, ready to be replaced with chart components once the data layer lands.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">March</p>
          </div>
          <div className="mt-8 flex h-72 items-end gap-4 rounded-[1.5rem] bg-surface-subtle px-5 pb-6 pt-8">
            {[56, 78, 44, 82, 74, 63, 91].map((height, index) => (
              <div key={height} className="flex flex-1 flex-col items-center justify-end gap-3">
                <div
                  className={`w-full rounded-t-2xl ${index % 2 === 0 ? "bg-primary/85" : "bg-secondary/80"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="font-mono text-xs text-muted">W{index + 1}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-[1.8rem] border border-black/6 bg-surface p-7">
          <p className="font-display text-2xl font-bold text-foreground">Next modules</p>
          <div className="mt-6 space-y-4">
            {["Transactions CRUD", "Budget planner", "Savings goals", "Document upload center"].map((item) => (
              <div key={item} className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm text-muted">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
