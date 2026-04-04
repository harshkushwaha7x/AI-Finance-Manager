"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBudgetStatusLabel, getBudgetStatusVariant } from "@/features/budgets/budget-utils";
import type { BudgetAlert } from "@/types/finance";

type BudgetAlertPanelProps = {
  alerts: BudgetAlert[];
};

export function BudgetAlertPanel({ alerts }: BudgetAlertPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Alerts</p>
            <CardTitle className="mt-3">What needs budget attention right now</CardTitle>
          </div>
          <Badge variant={alerts.length ? "warning" : "success"}>
            {alerts.length ? `${alerts.length} active` : "All clear"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-2 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{alert.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{alert.description}</p>
                  </div>
                </div>
                <Badge variant={getBudgetStatusVariant(alert.status)}>
                  {formatBudgetStatusLabel(alert.status)}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Every active budget is still in a healthy range
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  As soon as a budget crosses its threshold, this panel will surface the most important watchlist items first.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
