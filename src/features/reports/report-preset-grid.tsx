import { FileSpreadsheet, ReceiptText, Scale, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportPreset, ReportPresetId } from "@/types/reports";

type ReportPresetGridProps = {
  presets: ReportPreset[];
  activePresetId: ReportPresetId;
  isGenerating: boolean;
  onGenerate: (presetId: ReportPresetId) => void;
};

function getPresetIcon(presetId: ReportPresetId) {
  switch (presetId) {
    case "cashflow_scan":
      return FileSpreadsheet;
    case "budget_health":
      return Sparkles;
    case "tax_prep":
      return Scale;
    default:
      return ReceiptText;
  }
}

function getBadgeVariant(tone: ReportPreset["tone"]) {
  switch (tone) {
    case "secondary":
      return "secondary" as const;
    case "warning":
      return "warning" as const;
    case "success":
      return "success" as const;
    default:
      return "primary" as const;
  }
}

export function ReportPresetGrid({
  presets,
  activePresetId,
  isGenerating,
  onGenerate,
}: ReportPresetGridProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-4">
      {presets.map((preset) => {
        const Icon = getPresetIcon(preset.id);

        return (
          <Card
            key={preset.id}
            className={
              preset.id === activePresetId
                ? "rounded-[1.7rem] border-primary/30 shadow-lg shadow-primary/10"
                : "rounded-[1.7rem]"
            }
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-primary/8 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant={getBadgeVariant(preset.tone)}>{preset.format.toUpperCase()}</Badge>
              </div>
              <div>
                <CardTitle>{preset.label}</CardTitle>
                <CardDescription className="mt-2">{preset.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant={preset.id === activePresetId ? "primary" : "secondary"}
                className="w-full"
                disabled={isGenerating}
                onClick={() => onGenerate(preset.id)}
              >
                {isGenerating && preset.id === activePresetId ? "Generating..." : "Generate report"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
