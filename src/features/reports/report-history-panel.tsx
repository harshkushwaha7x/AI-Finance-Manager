import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportHistoryRecord } from "@/types/finance";
import { formatReportDateRange } from "@/features/reports/report-utils";

type ReportHistoryPanelProps = {
  history: ReportHistoryRecord[];
  activeReportId?: string;
  onSelect: (reportId: string) => void;
};

export function ReportHistoryPanel({
  history,
  activeReportId,
  onSelect,
}: ReportHistoryPanelProps) {
  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">History</p>
        <CardTitle className="mt-3">Generated snapshots</CardTitle>
        <CardDescription>
          Re-open prior report runs, compare narrative changes, and export older periods without rebuilding everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length ? (
          history.map((record) => {
            const isActive = record.id === activeReportId;

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
                className={`w-full rounded-[1.4rem] border p-4 text-left transition ${
                  isActive
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{record.periodLabel}</p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {formatReportDateRange(
                        record.response.periodStart,
                        record.response.periodEnd,
                      )}
                    </p>
                  </div>
                  <Badge variant={record.source === "openai" ? "primary" : "neutral"}>
                    {record.source === "openai" ? "OpenAI" : "Fallback"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{new Date(record.generatedAt).toLocaleString("en-IN")}</span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-border px-4 py-8 text-center text-sm leading-7 text-muted">
            No report has been saved yet. Generate your first snapshot from one of the presets above.
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            if (history[0]) {
              onSelect(history[0].id);
            }
          }}
          disabled={!history[0]}
        >
          Re-open latest report
        </Button>
      </CardContent>
    </Card>
  );
}
