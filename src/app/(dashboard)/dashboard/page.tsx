import { MetricCard } from "@/components/dashboard/metric-card";
import { CashflowTrendChart } from "@/components/charts/cashflow-trend-chart";
import { SpendDonutChart } from "@/components/charts/spend-donut-chart";
import { DemoResetButton } from "@/features/onboarding/demo-reset-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getViewerContext } from "@/lib/auth/viewer";
import { getDashboardDemoContent } from "@/lib/onboarding/constants";
import { getOnboardingState } from "@/lib/onboarding/server";

export default async function DashboardPage() {
  const viewer = await getViewerContext();
  const onboardingState = await getOnboardingState(viewer);
  const dashboardContent = getDashboardDemoContent(onboardingState.profileType);
  const firstName = onboardingState.fullName.split(" ")[0] || viewer.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description={`${dashboardContent.description} The current demo workspace is configured as ${onboardingState.profileType}, so the metrics and actions already match that operating mode.`}
        badge={onboardingState.profileType}
        actions={
          <>
            <DemoResetButton />
            <Button>Open quick action list</Button>
          </>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-foreground p-8 text-white panel-shadow">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Overview</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            {dashboardContent.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/76">
            {onboardingState.workspaceName || "Your workspace"} is now configured with onboarding-aware
            demo data, which means the dashboard immediately tells a more believable product story during
            portfolio reviews and walkthroughs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {dashboardContent.quickActions.map((item) => (
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
            {dashboardContent.activities.map((activity) => (
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
        {dashboardContent.metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CashflowTrendChart data={dashboardContent.cashflowData} />
        <SpendDonutChart data={dashboardContent.spendDistribution} />
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
          {dashboardContent.modules.map((item) => (
            <div key={item} className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm text-muted">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
