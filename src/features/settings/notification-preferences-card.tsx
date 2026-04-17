"use client";

import { useEffect, useState } from "react";
import { Bell, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NotificationPreferences } from "@/types/settings";
import {
  getNotificationPreferenceDescription,
  getNotificationPreferenceLabel,
} from "@/features/settings/settings-utils";

type NotificationPreferencesCardProps = {
  preferences: NotificationPreferences;
  isSaving: boolean;
  onSave: (values: NotificationPreferences) => Promise<void>;
};

export function NotificationPreferencesCard({
  preferences,
  isSaving,
  onSave,
}: NotificationPreferencesCardProps) {
  const [draft, setDraft] = useState(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(preferences);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>
          Decide which signals stay loud inside the workspace as budgeting, reports, and service
          work evolves.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(Object.keys(draft) as Array<keyof NotificationPreferences>).map((key) => (
          <div
            key={key}
            className="flex flex-col gap-4 rounded-[1.3rem] border border-black/6 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-foreground">
                {getNotificationPreferenceLabel(key)}
              </p>
              <p className="mt-1 text-sm leading-7 text-muted">
                {getNotificationPreferenceDescription(key)}
              </p>
            </div>
            <Button
              type="button"
              variant={draft[key] ? "primary" : "secondary"}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  [key]: !current[key],
                }))
              }
            >
              <Bell className="h-4 w-4" />
              {draft[key] ? "Enabled" : "Disabled"}
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-between border-t border-black/6 pt-6">
        <p className="text-sm leading-7 text-muted">
          These toggles influence how active alerts and service updates surface in the app.
        </p>
        <Button
          type="button"
          disabled={isSaving || !hasChanges}
          onClick={() => void onSave(draft)}
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
