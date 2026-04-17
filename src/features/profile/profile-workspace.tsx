"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { ProfileAccountPanel } from "@/features/profile/profile-account-panel";
import { ProfileFormCard } from "@/features/profile/profile-form-card";
import { ProfileSummaryStrip } from "@/features/profile/profile-summary-strip";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type {
  ProfileUpdateInput,
  ProfileWorkspaceState,
} from "@/types/settings";

type ProfileWorkspaceProps = {
  initialState: ProfileWorkspaceState;
};

type ProfileMutationPayload = ProfileWorkspaceState & {
  ok?: boolean;
  message?: string;
};

export function ProfileWorkspace({ initialState }: ProfileWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(values: ProfileUpdateInput) {
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as ProfileMutationPayload;

      if (!response.ok || !payload.profile || !payload.summary || !payload.subscription) {
        throw new Error(payload.message ?? "Unable to save profile settings.");
      }

      setWorkspaceState({
        profile: payload.profile,
        summary: payload.summary,
        subscription: payload.subscription,
        source: payload.source,
      });
      emitNotificationsChanged();
      toast.success("Profile updated and saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="Shape the identity layer behind the finance workspace"
        description="This is the user-facing account surface for personal details, currency defaults, locale, and the product identity that carries through invoices, dashboards, and service workflows."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <ProfileSummaryStrip
        summary={workspaceState.summary}
        subscription={workspaceState.subscription}
      />

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <ProfileFormCard
          profile={workspaceState.profile}
          isSaving={isSaving}
          onSubmit={handleSubmit}
        />
        <ProfileAccountPanel
          profile={workspaceState.profile}
          summary={workspaceState.summary}
          subscription={workspaceState.subscription}
          source={workspaceState.source}
        />
      </div>
    </div>
  );
}
