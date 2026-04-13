"use client";

import { Save, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  buildTaxSummaryText,
  downloadTaxWorkspaceJson,
  formatTaxDateRange,
} from "@/features/tax-center/tax-utils";
import type { TaxPeriod, TaxWorkspaceState } from "@/types/finance";

type TaxNotesPanelProps = {
  state: TaxWorkspaceState;
  onSaved: (nextState: TaxWorkspaceState) => void;
};

type TaxNotesMutationResponse = TaxWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function TaxNotesPanel({ state, onSaved }: TaxNotesPanelProps) {
  const [notes, setNotes] = useState(state.notes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(state.notes);
  }, [state.notes]);

  async function handleSave(period: TaxPeriod) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/tax/gst-summary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, period }),
      });
      const payload = (await response.json()) as TaxNotesMutationResponse;

      if (!response.ok || !payload.summary || !payload.breakdown) {
        throw new Error(payload.message ?? "Unable to save tax notes right now.");
      }

      onSaved(payload);
      toast.success("Tax notes saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save tax notes.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(buildTaxSummaryText(state));
      toast.success("Tax summary copied to clipboard.");
    } catch {
      toast.error("Unable to copy the tax summary right now.");
    }
  }

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Notes and export</p>
        <CardTitle className="mt-3">Accountant handoff notes</CardTitle>
        <CardDescription className="mt-2">
          Capture filing context, open questions, or manual observations for {formatTaxDateRange(state.periodStart, state.periodEnd)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add GST follow-ups, accountant questions, reconciliation notes, or filing reminders..."
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void handleSave(state.period)} disabled={isSaving}>
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save notes"}
          </Button>
          <Button variant="secondary" onClick={handleCopySummary}>
            <Share2 className="h-4 w-4" />
            Copy summary
          </Button>
          <Button variant="secondary" onClick={() => downloadTaxWorkspaceJson(state)}>
            Export JSON
          </Button>
        </div>
        <p className="text-sm leading-7 text-muted">
          {state.noteUpdatedAt
            ? `Last updated ${new Date(state.noteUpdatedAt).toLocaleString("en-IN")}.`
            : "No manual tax note saved yet."}
        </p>
      </CardContent>
    </Card>
  );
}
