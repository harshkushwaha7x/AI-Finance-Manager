"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxActivityPanel } from "@/features/tax-center/tax-activity-panel";
import { TaxGstBreakdownCard } from "@/features/tax-center/tax-gst-breakdown-card";
import { TaxNotesPanel } from "@/features/tax-center/tax-notes-panel";
import { TaxPeriodPills } from "@/features/tax-center/tax-period-pills";
import { TaxReadinessPanel } from "@/features/tax-center/tax-readiness-panel";
import { TaxSummaryStrip } from "@/features/tax-center/tax-summary-strip";
import { formatTaxDateRange } from "@/features/tax-center/tax-utils";
import type { TaxPeriod, TaxWorkspaceState } from "@/types/finance";

type TaxCenterWorkspaceProps = {
  initialState: TaxWorkspaceState;
};

type TaxWorkspaceResponse = TaxWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function TaxCenterWorkspace({ initialState }: TaxCenterWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);

  async function handlePeriodChange(period: TaxPeriod) {
    if (period === workspaceState.period) {
      return;
    }

    setIsLoadingPeriod(true);

    try {
      const response = await fetch(`/api/tax/gst-summary?period=${period}`);
      const payload = (await response.json()) as TaxWorkspaceResponse;

      if (!response.ok || !payload.summary || !payload.breakdown) {
        throw new Error(payload.message ?? "Unable to refresh the tax summary.");
      }

      setWorkspaceState(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh the tax summary.";
      toast.error(message);
    } finally {
      setIsLoadingPeriod(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tax center"
        title="Run GST readiness like an operating workflow"
        description="Use one place to review output tax, invoice coverage, receipt support, and manual handoff notes before filing time or accountant review."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <Card className="rounded-[1.7rem] border-warning/20 bg-warning/5">
        <CardHeader className="flex-row items-start gap-4 space-y-0">
          <div className="rounded-2xl bg-warning/15 p-3 text-warning">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Compliance note</CardTitle>
            <CardDescription className="mt-2">
              This workspace is designed to support GST preparation and accountant collaboration, not replace legal or tax advice. Final filing decisions should still be reviewed professionally.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <TaxPeriodPills
        period={workspaceState.period}
        isLoading={isLoadingPeriod}
        onChange={(period) => {
          void handlePeriodChange(period);
        }}
      />

      <TaxSummaryStrip summary={workspaceState.summary} />

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <TaxGstBreakdownCard state={workspaceState} />
        <TaxNotesPanel
          state={workspaceState}
          onSaved={(nextState) => {
            setWorkspaceState(nextState);
          }}
        />
      </div>

      <TaxReadinessPanel checklist={workspaceState.checklist} />

      <TaxActivityPanel state={workspaceState} />

      <p className="text-sm leading-7 text-muted">
        Active period: {formatTaxDateRange(workspaceState.periodStart, workspaceState.periodEnd)}
        {workspaceState.gstin ? ` | Workspace GSTIN: ${workspaceState.gstin}` : " | Workspace GSTIN is not configured yet."}
      </p>
    </div>
  );
}
