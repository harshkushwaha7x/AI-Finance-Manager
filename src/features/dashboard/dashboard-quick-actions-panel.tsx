import Link from "next/link";
import { ArrowRight, Bolt } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardOverviewState } from "@/types/dashboard";

type DashboardQuickActionsPanelProps = {
  actions: DashboardOverviewState["quickActions"];
};

function getActionDescription(href: string) {
  if (href.includes("/expenses")) {
    return "Capture spending quickly and keep category pressure visible.";
  }

  if (href.includes("/income")) {
    return "Track cash-in, recurring revenue, and source trends.";
  }

  if (href.includes("/reports")) {
    return "Generate a fresh finance snapshot and export-ready summary.";
  }

  if (href.includes("/documents")) {
    return "Upload receipts, invoices, and finance files for review.";
  }

  if (href.includes("/accountant")) {
    return "Route accounting support into the service workflow.";
  }

  if (href.includes("/transactions")) {
    return "Open the ledger and manage the live transaction queue.";
  }

  return "Jump straight into the next finance workflow without losing context.";
}

export function DashboardQuickActionsPanel({
  actions,
}: DashboardQuickActionsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/8 p-3 text-primary">
            <Bolt className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Quick launch actions</CardTitle>
            <CardDescription className="mt-2">
              Fast routes into the finance workflows you’ll touch most often during daily shipping.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-[1.3rem] border border-black/6 bg-background p-4 transition hover:border-primary/25 hover:bg-surface-subtle"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {getActionDescription(action.href)}
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-muted" />
            </div>
          </Link>
        ))}
        <div className="rounded-[1.3rem] border border-dashed border-black/8 bg-surface-subtle p-4 md:col-span-2">
          <p className="text-sm font-semibold text-foreground">Power tip</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Use <span className="font-mono">Ctrl/Cmd + K</span> from anywhere in the workspace to
            open the new command palette and jump straight to routes, reports, uploads, and service
            actions.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" disabled>
              Command palette shortcut
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
