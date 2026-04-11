"use client";

import { Download, FileJson2, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildReportCsvContent,
  buildReportShareText,
  downloadBlobFile,
} from "@/features/reports/report-utils";
import type { ReportHistoryRecord } from "@/types/finance";

type ReportExportToolbarProps = {
  current: ReportHistoryRecord;
};

function getBaseFileName(record: ReportHistoryRecord) {
  return `${record.response.reportType}-${record.response.periodStart}-${record.response.periodEnd}`;
}

export function ReportExportToolbar({ current }: ReportExportToolbarProps) {
  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(buildReportShareText(current));
      toast.success("Report summary copied to clipboard.");
    } catch {
      toast.error("Unable to copy the report summary right now.");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        onClick={() => {
          downloadBlobFile(
            JSON.stringify(current.response, null, 2),
            `${getBaseFileName(current)}.json`,
            "application/json",
          );
        }}
      >
        <FileJson2 className="h-4 w-4" />
        Export JSON
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          downloadBlobFile(
            buildReportCsvContent(current.response),
            `${getBaseFileName(current)}.csv`,
            "text/csv;charset=utf-8",
          );
        }}
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="secondary" onClick={handleCopySummary}>
        <Share2 className="h-4 w-4" />
        Copy summary
      </Button>
      <Button variant="primary" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </Button>
    </div>
  );
}
