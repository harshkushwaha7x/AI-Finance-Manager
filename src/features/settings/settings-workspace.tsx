"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { BusinessSettingsForm } from "@/features/settings/business-settings-form";
import { NotificationPreferencesCard } from "@/features/settings/notification-preferences-card";
import { PlanOverviewCard } from "@/features/settings/plan-overview-card";
import { SettingsChecklistPanel } from "@/features/settings/settings-checklist-panel";
import { SettingsSummaryStrip } from "@/features/settings/settings-summary-strip";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type {
  BusinessSettingsUpdateInput,
  NotificationPreferences,
  SettingsWorkspaceState,
} from "@/types/settings";

type SettingsWorkspaceProps = {
  initialState: SettingsWorkspaceState;
};

type SettingsMutationPayload = SettingsWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function SettingsWorkspace({ initialState }: SettingsWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  async function handleBusinessSave(values: BusinessSettingsUpdateInput) {
    setIsSavingBusiness(true);

    try {
      const response = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as SettingsMutationPayload;

      if (
        !response.ok ||
        !payload.businessProfile ||
        !payload.notificationPreferences ||
        !payload.summary ||
        !payload.subscription
      ) {
        throw new Error(payload.message ?? "Unable to save business settings.");
      }

      setWorkspaceState(payload);
      emitNotificationsChanged();
      toast.success("Business settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSavingBusiness(false);
    }
  }

  async function handlePreferenceSave(values: NotificationPreferences) {
    setIsSavingPreferences(true);

    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as SettingsMutationPayload;

      if (
        !response.ok ||
        !payload.businessProfile ||
        !payload.notificationPreferences ||
        !payload.summary ||
        !payload.subscription
      ) {
        throw new Error(payload.message ?? "Unable to save notification preferences.");
      }

      setWorkspaceState(payload);
      emitNotificationsChanged();
      toast.success("Notification preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Configure the business defaults behind finance, tax, and service workflows"
        description="This workspace ties together business identity, GST and invoice defaults, subscription visibility, and notification preferences so the product behaves like a serious SaaS system."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <SettingsSummaryStrip
        summary={workspaceState.summary}
        subscription={workspaceState.subscription}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <BusinessSettingsForm
          businessProfile={workspaceState.businessProfile}
          isSaving={isSavingBusiness}
          onSubmit={handleBusinessSave}
        />
        <div className="space-y-6">
          <PlanOverviewCard subscription={workspaceState.subscription} />
          <SettingsChecklistPanel checklist={workspaceState.checklist} />
        </div>
      </div>

      <NotificationPreferencesCard
        preferences={workspaceState.notificationPreferences}
        isSaving={isSavingPreferences}
        onSave={handlePreferenceSave}
      />
    </div>
  );
}
