"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { useHydrated } from "@/hooks/use-hydrated";
import type { IncomeTrendPoint } from "@/types/income";

type IncomeTrendChartProps = {
  data: IncomeTrendPoint[];
};

export function IncomeTrendChart({ data }: IncomeTrendChartProps) {
  const isHydrated = useHydrated();

  return (
    <ChartShell
      title="Income trend"
      description="Watch recent weekly cash-in movement so salary, retainers, and invoice collections are easier to compare."
      badge="Last 6 weeks"
    >
      <div className="h-72">
        {isHydrated ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#155eef" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#155eef" stopOpacity={0.04} />
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
                dataKey="income"
                stroke="#155eef"
                fill="url(#incomeGradient)"
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
