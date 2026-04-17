import { CheckCircle2, CircleDashed } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SettingsChecklistItem } from "@/types/settings";

type SettingsChecklistPanelProps = {
  checklist: SettingsChecklistItem[];
};

export function SettingsChecklistPanel({
  checklist,
}: SettingsChecklistPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup checklist</CardTitle>
        <CardDescription>
          A simple operations checklist keeps the settings page focused on actual product readiness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-[1.2rem] border border-black/6 bg-background px-4 py-4"
          >
            {item.complete ? (
              <CheckCircle2 className="mt-1 h-4 w-4 text-success" />
            ) : (
              <CircleDashed className="mt-1 h-4 w-4 text-warning" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-7 text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
