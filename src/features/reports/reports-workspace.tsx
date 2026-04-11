"use client";

import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportExportToolbar } from "@/features/reports/report-export-toolbar";
import { ReportHistoryPanel } from "@/features/reports/report-history-panel";
import { ReportPresetGrid } from "@/features/reports/report-preset-grid";
import { ReportSummaryStrip } from "@/features/reports/report-summary-strip";
import {
  buildReportPresets,
  buildReportRequestFromPreset,
  formatReportDateRange,
} from "@/features/reports/report-utils";
import { PrintableReportCard } from "@/features/reports/printable-report-card";
import type { ReportWorkspaceState } from "@/types/finance";
import type { ReportPresetId } from "@/types/reports";

type ReportsWorkspaceProps = {
  initialState: ReportWorkspaceState;
};

type ReportGenerateResponse = ReportWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function ReportsWorkspace({ initialState }: ReportsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [activePresetId, setActivePresetId] = useState<ReportPresetId>("monthly_snapshot");
  const [activeReportId, setActiveReportId] = useState(initialState.current?.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const presets = useMemo(() => buildReportPresets(), []);

  const activeRecord = useMemo(() => {
    if (workspaceState.history.length && activeReportId) {
      const matched = workspaceState.history.find((item) => item.id === activeReportId);

      if (matched) {
        return matched;
      }
    }

    return workspaceState.current;
  }, [activeReportId, workspaceState]);

  async function handleGenerate(presetId: ReportPresetId) {
    setActivePresetId(presetId);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReportRequestFromPreset(presetId)),
      });
      const payload = (await response.json()) as ReportGenerateResponse;

      if (!response.ok || !payload.current || !payload.history || !payload.source) {
        throw new Error(payload.message ?? "Unable to generate the report right now.");
      }

      setWorkspaceState({
        current: payload.current,
        history: payload.history,
        source: payload.source,
      });
      setActiveReportId(payload.current.id);
      toast.success("Report generated and saved to history.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate the report.";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!activeRecord) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Reports"
          title="Generate finance stories and export-ready summaries"
          description="Build monthly snapshots, budget reviews, cashflow scans, and tax-oriented handoff notes from the same ledger data powering the rest of the workspace."
          badge="Reports live"
        />
        <ReportPresetGrid
          presets={presets}
          activePresetId={activePresetId}
          isGenerating={isGenerating}
          onGenerate={(presetId) => {
            void handleGenerate(presetId);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Turn finance activity into export-ready operating narratives"
        description="Generate structured monthly reports, review saved snapshots, and export clean JSON or CSV files for your portfolio demo, stakeholders, or accountant handoff."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              void handleGenerate(activePresetId);
            }}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Refresh active report"}
          </Button>
        }
      />

      <ReportPresetGrid
        presets={presets}
        activePresetId={activePresetId}
        isGenerating={isGenerating}
        onGenerate={(presetId) => {
          void handleGenerate(presetId);
        }}
      />

      <ReportSummaryStrip current={activeRecord} />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.7rem]">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-primary">Current snapshot</p>
                <CardTitle className="mt-3">Export and share</CardTitle>
                <CardDescription className="mt-2">
                  {formatReportDateRange(
                    activeRecord.response.periodStart,
                    activeRecord.response.periodEnd,
                  )}
                </CardDescription>
              </div>
              <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ReportExportToolbar current={activeRecord} />
          </CardContent>
        </Card>

        <ReportHistoryPanel
          history={workspaceState.history}
          activeReportId={activeRecord.id}
          onSelect={setActiveReportId}
        />
      </div>

      <PrintableReportCard current={activeRecord} />
    </div>
  );
}
