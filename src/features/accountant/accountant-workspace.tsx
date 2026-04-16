"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { AccountantRequestForm } from "@/features/accountant/accountant-request-form";
import { AccountantSummaryStrip } from "@/features/accountant/accountant-summary-strip";
import { RequestListPanel } from "@/features/accountant/request-list-panel";
import { RequestTimelinePanel } from "@/features/accountant/request-timeline-panel";
import { ServicePackageGrid } from "@/features/accountant/service-package-grid";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type {
  AccountantPackageRecord,
  AccountantRequestInput,
  AccountantRequestRecord,
  AccountantRequestSummary,
  AccountantWorkspaceState,
} from "@/types/finance";

type AccountantWorkspaceProps = {
  initialState: AccountantWorkspaceState;
  initialWorkspaceName?: string;
  initialGstin?: string;
};

type AccountantMutationPayload = {
  ok?: boolean;
  message?: string;
  request?: AccountantRequestRecord;
  requests?: AccountantRequestRecord[];
  packages?: AccountantPackageRecord[];
  summary?: AccountantRequestSummary;
  source?: AccountantWorkspaceState["source"];
};

function getInitialPackageId(state: AccountantWorkspaceState) {
  return (
    state.requests.find((request) => request.packageId)?.packageId ??
    state.packages.find((packageRecord) => packageRecord.isActive)?.id ??
    state.packages[0]?.id
  );
}

export function AccountantWorkspace({
  initialState,
  initialWorkspaceName,
  initialGstin,
}: AccountantWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(
    getInitialPackageId(initialState),
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    initialState.requests[0]?.id ?? null,
  );

  const activeRequest = useMemo(
    () =>
      workspaceState.requests.find((request) => request.id === selectedRequestId) ??
      workspaceState.requests[0] ??
      null,
    [selectedRequestId, workspaceState.requests],
  );

  async function handleCreateRequest(values: AccountantRequestInput) {
    const response = await fetch("/api/accountant/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as AccountantMutationPayload;

    if (!response.ok || !payload.request || !payload.requests || !payload.summary) {
      throw new Error(payload.message ?? "Unable to create the accountant request.");
    }

    setWorkspaceState((current) => ({
      packages: payload.packages ?? current.packages,
      requests: payload.requests ?? current.requests,
      documentOptions: current.documentOptions,
      summary: payload.summary ?? current.summary,
      source: payload.source ?? current.source,
    }));
    setSelectedRequestId(payload.request.id);

    if (payload.request.packageId) {
      setSelectedPackageId(payload.request.packageId);
    }

    emitNotificationsChanged();
    toast.success("Accountant request submitted and added to the service queue.");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Accountant services"
        title="Turn finance pain into a real service-qualified workflow"
        description="Package selection, request intake, document context, and service status now live together in one workspace so the product side and accountant lane feel like the same startup system."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <AccountantSummaryStrip summary={workspaceState.summary} />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <ServicePackageGrid
          packages={workspaceState.packages}
          activePackageId={selectedPackageId}
          onSelect={setSelectedPackageId}
        />
        <AccountantRequestForm
          packages={workspaceState.packages}
          documentOptions={workspaceState.documentOptions}
          selectedPackageId={selectedPackageId}
          initialWorkspaceName={
            activeRequest?.context.workspaceName || initialWorkspaceName || "Finance workspace"
          }
          initialGstin={activeRequest?.context.gstin || initialGstin || ""}
          onSelectPackage={setSelectedPackageId}
          onSubmit={handleCreateRequest}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <RequestListPanel
          requests={workspaceState.requests}
          activeRequestId={activeRequest?.id ?? null}
          onSelect={setSelectedRequestId}
        />
        <RequestTimelinePanel request={activeRequest} />
      </div>
    </div>
  );
}
