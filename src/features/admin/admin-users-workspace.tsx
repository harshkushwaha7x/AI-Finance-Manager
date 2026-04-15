"use client";

import { useMemo, useState } from "react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminUserWorkspaceState } from "@/types/admin";

import {
  formatProfileTypeLabel,
  getProfileTypeBadgeVariant,
} from "./admin-utils";

type AdminUsersWorkspaceProps = {
  initialState: AdminUserWorkspaceState;
};

export function AdminUsersWorkspace({ initialState }: AdminUsersWorkspaceProps) {
  const [workspaceState] = useState(initialState);
  const [searchValue, setSearchValue] = useState("");
  const [profileFilter, setProfileFilter] = useState<"all" | "personal" | "freelancer" | "business">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialState.users[0]?.id ?? null,
  );

  const filteredUsers = useMemo(() => {
    return workspaceState.users.filter((user) => {
      const matchesSearch = [
        user.displayName,
        user.email,
        user.workspaceName,
        user.planLabel,
        user.latestActivity,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesProfile = profileFilter === "all" || user.profileType === profileFilter;

      return matchesSearch && matchesProfile;
    });
  }, [profileFilter, searchValue, workspaceState.users]);

  const activeUser = useMemo(
    () =>
      workspaceState.users.find((user) => user.id === selectedUserId) ??
      workspaceState.users[0] ??
      null,
    [selectedUserId, workspaceState.users],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin users"
        title="Give support a clean customer context view"
        description="This support-facing workspace helps you inspect account type, onboarding, plan, request volume, and document activity before responding."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Workspace records"
          value={String(workspaceState.users.length)}
          detail="Users currently visible to support through this admin lookup surface."
        />
        <MetricCard
          label="Onboarded"
          value={String(workspaceState.users.filter((user) => user.onboardingCompleted).length)}
          detail="Accounts that have completed setup and can use the main workspace."
          deltaTone="success"
        />
        <MetricCard
          label="Open service volume"
          value={String(workspaceState.users.reduce((total, user) => total + user.requestCount, 0))}
          detail="Combined service requests tied to the visible support accounts."
        />
        <MetricCard
          label="Uploaded documents"
          value={String(workspaceState.users.reduce((total, user) => total + user.documentCount, 0))}
          detail="Document footprint support can use as a signal before outreach."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <Card>
          <CardHeader className="space-y-6">
            <SectionToolbar
              title="Support lookup"
              description="Search by user, workspace, or recent activity and narrow by account type."
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search user, workspace, or plan"
              />
              <Select
                value={profileFilter}
                onChange={(event) =>
                  setProfileFilter(
                    event.target.value as "all" | "personal" | "freelancer" | "business",
                  )
                }
              >
                <option value="all">All account types</option>
                <option value="personal">Personal</option>
                <option value="freelancer">Freelancer</option>
                <option value="business">Business</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                    user.id === activeUser?.id
                      ? "border-secondary/30 bg-secondary/6"
                      : "border-black/6 bg-surface-subtle hover:border-secondary/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                      <p className="mt-1 text-sm text-muted">{user.workspaceName}</p>
                    </div>
                    <Badge variant={getProfileTypeBadgeVariant(user.profileType)}>
                      {formatProfileTypeLabel(user.profileType)}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">{user.latestActivity}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No users match</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Adjust the search or profile filter to widen the support view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Support profile</CardTitle>
            <CardDescription>
              A compact view of workspace health, service usage, and onboarding state for the selected account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeUser ? (
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-black/6 bg-foreground p-6 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-3xl font-bold tracking-tight">
                        {activeUser.displayName}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/72">{activeUser.email}</p>
                    </div>
                    <Badge variant="secondary" className="bg-white/10 text-white">
                      {activeUser.planLabel}
                    </Badge>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-white/78">{activeUser.latestActivity}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Workspace</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activeUser.workspaceName}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Account type</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {formatProfileTypeLabel(activeUser.profileType)}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Service requests</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activeUser.requestCount}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Documents</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activeUser.documentCount}</p>
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-5">
                  <p className="text-sm font-semibold text-foreground">Support readiness</p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Onboarding is {activeUser.onboardingCompleted ? "complete" : "still in progress"}.
                    Use this context before reaching out so your response matches where the user really is in the product.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">Pick a user</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Select an account from the left to open the support profile view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
