"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { useHydrated } from "@/hooks/use-hydrated";

type SpendSharePoint = {
  name: string;
  value: number;
};

type SpendDonutChartProps = {
  data: SpendSharePoint[];
};

const COLORS = ["#0f766e", "#155eef", "#f79009", "#e5484d", "#94a3b8"];

export function SpendDonutChart({ data }: SpendDonutChartProps) {
  const isHydrated = useHydrated();

  return (
    <ChartShell
      title="Spend distribution"
      description="A compact category chart style that will plug directly into budgets and reports later."
      badge="By category"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="h-64">
          {isHydrated ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid rgba(17,24,39,0.08)",
                    background: "#ffffff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-full bg-surface-subtle" />
          )}
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl border border-black/6 bg-surface-subtle px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>
              <span className="font-mono text-sm text-muted">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartShell>
  );
}
