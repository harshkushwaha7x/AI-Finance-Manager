"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { useHydrated } from "@/hooks/use-hydrated";
import type { DashboardBudgetComparisonPoint } from "@/types/dashboard";

type BudgetProgressChartProps = {
  data: DashboardBudgetComparisonPoint[];
};

export function BudgetProgressChart({ data }: BudgetProgressChartProps) {
  const isHydrated = useHydrated();
  const hasData = data.length > 0;

  return (
    <ChartShell
      title="Budget vs actual"
      description="A planning preview that compares the current category spend mix against your onboarding budget target."
      badge="Category pulse"
    >
      <div className="h-80">
        {hasData ? (
          isHydrated ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} stroke="#667085" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#667085" />
              <Tooltip
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid rgba(17,24,39,0.08)",
                  background: "#ffffff",
                }}
              />
              <Bar dataKey="planned" radius={[10, 10, 0, 0]} fill="#155eef" fillOpacity={0.45} />
              <Bar dataKey="actual" radius={[10, 10, 0, 0]} fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
          ) : (
          <div className="h-full rounded-[1.4rem] bg-surface-subtle" />
          )
        ) : (
          <div className="flex h-full items-center justify-center rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-8 text-center">
            <p className="max-w-sm text-sm leading-7 text-muted">
              As soon as expenses are categorized, this chart will compare real spend against your planning target.
            </p>
          </div>
        )}
      </div>
    </ChartShell>
  );
}
