import { MetricCard } from "@/components/dashboard/metric-card";
import { CashflowTrendChart } from "@/components/charts/cashflow-trend-chart";
import { SpendDonutChart } from "@/components/charts/spend-donut-chart";
import { PageHeader } from "@/components/shared/page-header";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardActivities, dashboardSnapshot } from "@/lib/constants/site";

const metricCards = [
  {
    label: "Cash in",
    value: dashboardSnapshot.revenue,
    detail: "Combined revenue and retained income snapshot for the month.",
    delta: "+12.4%",
    deltaTone: "success" as const,
  },
  {
    label: "Cash out",
    value: dashboardSnapshot.spend,
    detail: "Expense volume across operations, subscriptions, and tax buckets.",
    delta: "+4.1%",
    deltaTone: "warning" as const,
  },
  {
    label: "Runway",
    value: dashboardSnapshot.runway,
    detail: "A simple portfolio-friendly metric to show future planning intent.",
    delta: "+0.8 mo",
    deltaTone: "secondary" as const,
  },
  {
    label: "Budget health",
    value: dashboardSnapshot.budgetHealth,
    detail: "Early warning surface for overspend and category pressure.",
    delta: "-3 pts",
    deltaTone: "danger" as const,
  },
];

const quickActions = [
  "Add a new transaction",
  "Upload a receipt or invoice",
  "Generate AI insights",
  "Request accountant support",
];

const cashflowData = [
  { label: "Jan", inflow: 78, outflow: 52 },
  { label: "Feb", inflow: 86, outflow: 58 },
  { label: "Mar", inflow: 94, outflow: 61 },
  { label: "Apr", inflow: 88, outflow: 57 },
  { label: "May", inflow: 101, outflow: 69 },
  { label: "Jun", inflow: 97, outflow: 63 },
];

const spendDistribution = [
  { name: "Operations", value: 34 },
  { name: "Tools", value: 21 },
  { name: "Tax", value: 18 },
  { name: "Travel", value: 15 },
  { name: "Other", value: 12 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="A polished control tower for finance, AI, and service workflows"
        description="Day 5 turns the dashboard into a reusable product system with stat cards, chart wrappers, section toolbars, and stronger layout consistency."
        badge="Design system"
        actions={
          <>
            <Button variant="secondary">Review widget states</Button>
            <Button>Open quick action list</Button>
          </>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-foreground p-8 text-white panel-shadow">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Overview</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            The dashboard now runs on reusable product primitives instead of page-specific styling.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/76">
            That means the next finance features can ship faster as small commits because charts, cards,
            toolbars, and form patterns already exist in one shared system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {quickActions.map((item) => (
              <Button key={item} variant="secondary" className="border-white/12 bg-white/8 text-white hover:bg-white/12">
                {item}
              </Button>
            ))}
          </div>
        </div>
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Build signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardActivities.map((activity) => (
              <div
                key={activity}
                className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted"
              >
                {activity}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CashflowTrendChart data={cashflowData} />
        <SpendDonutChart data={spendDistribution} />
      </section>
      <Card>
        <CardHeader>
          <SectionToolbar
            title="Next modules"
            description="These panels will adopt the same card, table, and chart primitives as soon as feature data is wired in."
            actions={<Button variant="secondary">Open roadmap slice</Button>}
          />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {["Transactions CRUD", "Budget planner", "Savings goals", "Document upload center"].map((item) => (
              <div key={item} className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm text-muted">
                {item}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
