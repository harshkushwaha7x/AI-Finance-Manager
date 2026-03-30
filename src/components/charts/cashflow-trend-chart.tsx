"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { useHydrated } from "@/hooks/use-hydrated";

type CashflowPoint = {
  label: string;
  inflow: number;
  outflow: number;
};

type CashflowTrendChartProps = {
  data: CashflowPoint[];
};

export function CashflowTrendChart({ data }: CashflowTrendChartProps) {
  const isHydrated = useHydrated();

  return (
    <ChartShell
      title="Cash flow trend"
      description="A reusable chart wrapper for upcoming live revenue and expense aggregation."
      badge="Monthly"
    >
      <div className="h-72">
        {isHydrated ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#155eef" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#155eef" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="outflowGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#667085" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#667085" />
              <Tooltip
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid rgba(17,24,39,0.08)",
                  background: "#ffffff",
                }}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#155eef"
                fill="url(#inflowGradient)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#0f766e"
                fill="url(#outflowGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-[1.4rem] bg-surface-subtle" />
        )}
      </div>
    </ChartShell>
  );
}
