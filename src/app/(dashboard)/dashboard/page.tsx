import Link from "next/link";

import { BudgetProgressChart } from "@/components/charts/budget-progress-chart";
import { CashflowTrendChart } from "@/components/charts/cashflow-trend-chart";
import { SpendDonutChart } from "@/components/charts/spend-donut-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DemoResetButton } from "@/features/onboarding/demo-reset-button";
import { DashboardQuickActionsPanel } from "@/features/dashboard/dashboard-quick-actions-panel";
import { GoalPreviewPanel } from "@/features/dashboard/goal-preview-panel";
import { RecentActivityFeed } from "@/features/dashboard/recent-activity-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext } from "@/lib/auth/viewer";
import { getDashboardOverviewState } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  const viewer = await getViewerContext();
  const dashboardOverview = await getDashboardOverviewState(viewer);
  const firstName =
    dashboardOverview.workspaceName.split(" ")[0] ||
    viewer.name?.split(" ")[0] ||
    "there";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description={`${dashboardOverview.summaryDescription} This overview is now powered by the real ledger and the onboarding targets already configured for your workspace.`}
        badge={dashboardOverview.profileType}
        actions={
          <>
            <DemoResetButton />
            <Button asChild variant="secondary">
              <Link href="/dashboard/transactions">Open ledger</Link>
            </Button>
          </>
        }
      />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-foreground p-8 text-white panel-shadow">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Analytics overview</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
            {dashboardOverview.summaryTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/76">
            {dashboardOverview.workspaceName} currently tracks{" "}
            {dashboardOverview.transactionCount} live ledger record
            {dashboardOverview.transactionCount === 1 ? "" : "s"}, including{" "}
            {dashboardOverview.incomeCount} income entries and {dashboardOverview.expenseCount} expenses.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {dashboardOverview.quickActions.map((action) => (
              <Button
                key={action.href}
                asChild
                variant="secondary"
                className="border-white/12 bg-white/8 text-white hover:bg-white/12"
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </div>
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Workspace pulse</CardTitle>
            <p className="text-sm leading-7 text-muted">
              A compact snapshot of where the current operating attention should go next.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4">
                <p className="text-sm font-medium text-muted">Pending review</p>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                  {dashboardOverview.pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4">
                <p className="text-sm font-medium text-muted">Focus areas</p>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                  {dashboardOverview.focusAreas.length}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {dashboardOverview.focusAreas.map((focusArea) => (
                <Badge key={focusArea} variant="secondary">
                  {focusArea.replace("-", " ")}
                </Badge>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
                Live charts now summarize income, expense, and planning pressure from the real dashboard data source.
              </div>
              <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
                Budget and goal cards now reflect live module data, so planning pressure and savings progress both update without extra dashboard-specific mock wiring.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardOverview.metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <CashflowTrendChart data={dashboardOverview.cashflowTrend} />
        <SpendDonutChart data={dashboardOverview.spendDistribution} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <BudgetProgressChart data={dashboardOverview.budgetComparison} />
        <GoalPreviewPanel goals={dashboardOverview.goalPreviews} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <RecentActivityFeed activities={dashboardOverview.recentActivity} />
        <DashboardQuickActionsPanel actions={dashboardOverview.quickActions} />
      </section>
    </div>
  );
}
