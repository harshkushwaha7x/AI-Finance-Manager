"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionToolbar } from "@/components/shared/section-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { AdminPackageInput, AdminPackageWorkspaceState } from "@/types/admin";
import type { AccountantPackageRecord } from "@/types/finance";

import { AdminPackageFormDrawer } from "./admin-package-form-drawer";
import { formatAdminDate } from "./admin-utils";

type AdminPackageMutationPayload = {
  ok?: boolean;
  message?: string;
  package?: AccountantPackageRecord;
  packages?: AccountantPackageRecord[];
  source?: AdminPackageWorkspaceState["source"];
};

type AdminPackagesWorkspaceProps = {
  initialState: AdminPackageWorkspaceState;
};

export function AdminPackagesWorkspace({ initialState }: AdminPackagesWorkspaceProps) {
  const [workspaceState, setWorkspaceState] = useState(initialState);
  const [filterValue, setFilterValue] = useState<"all" | "active" | "inactive">("all");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialState.packages[0]?.id ?? null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");

  const filteredPackages = useMemo(() => {
    if (filterValue === "active") {
      return workspaceState.packages.filter((item) => item.isActive);
    }

    if (filterValue === "inactive") {
      return workspaceState.packages.filter((item) => !item.isActive);
    }

    return workspaceState.packages;
  }, [filterValue, workspaceState.packages]);

  const activePackage = useMemo(
    () =>
      workspaceState.packages.find((item) => item.id === selectedPackageId) ??
      workspaceState.packages[0] ??
      null,
    [selectedPackageId, workspaceState.packages],
  );

  async function mutatePackage(values: AdminPackageInput) {
    const isEditMode = drawerMode === "edit" && activePackage;
    const url = isEditMode ? `/api/admin/packages/${activePackage.id}` : "/api/admin/packages";
    const method = isEditMode ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as AdminPackageMutationPayload;

    if (!response.ok || !payload.package || !payload.packages) {
      throw new Error(payload.message ?? "Unable to save the package.");
    }

    setWorkspaceState((current) => ({
      packages: payload.packages ?? current.packages,
      source: payload.source ?? current.source,
    }));
    setSelectedPackageId(payload.package.id);
    setDrawerOpen(false);
    toast.success(isEditMode ? "Package updated." : "Package created.");
  }

  const activeCount = workspaceState.packages.filter((item) => item.isActive).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin packages"
        title="Treat service packaging like a real growth lever"
        description="Offer creation, activation, and copy updates now happen inside a dedicated admin manager so the accountant service lane stays product-ready."
        badge={workspaceState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setDrawerMode("create");
              setDrawerOpen(true);
            }}
          >
            New package
          </Button>
        }
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total packages"
          value={String(workspaceState.packages.length)}
          detail="Visible and archived service offers tracked in the operations layer."
        />
        <MetricCard
          label="Active offers"
          value={String(activeCount)}
          detail="Packages currently available in the customer-facing accountant workspace."
          deltaTone="success"
        />
        <MetricCard
          label="Inactive offers"
          value={String(workspaceState.packages.length - activeCount)}
          detail="Offers preserved for history or later relaunch without deleting ops context."
        />
        <MetricCard
          label="Audience segments"
          value={String(new Set(workspaceState.packages.map((item) => item.audience)).size)}
          detail="Distinct positioning angles currently covered by the package catalog."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <Card>
          <CardHeader className="space-y-6">
            <SectionToolbar
              title="Package catalog"
              description="Pick a package to inspect or narrow the list by current live state."
              actions={
                <Select
                  value={filterValue}
                  onChange={(event) =>
                    setFilterValue(event.target.value as "all" | "active" | "inactive")
                  }
                  className="min-w-40"
                >
                  <option value="all">All packages</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </Select>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredPackages.length ? (
              filteredPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`w-full rounded-[1.4rem] border p-5 text-left transition ${
                    pkg.id === activePackage?.id
                      ? "border-primary/35 bg-primary/6"
                      : "border-black/6 bg-surface-subtle hover:border-primary/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold tracking-tight text-foreground">
                        {pkg.name}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">{pkg.audience}</p>
                    </div>
                    <Badge variant={pkg.isActive ? "success" : "neutral"}>
                      {pkg.isActive ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-muted">{pkg.description}</p>
                </button>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">No packages match</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Try switching the active filter or create a new offer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Package detail</CardTitle>
            <CardDescription>
              Review the live sales copy and update the selected offer without leaving the admin surface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activePackage ? (
              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-black/6 bg-foreground p-6 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-3xl font-bold tracking-tight">
                        {activePackage.name}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/72">{activePackage.audience}</p>
                    </div>
                    <Badge
                      variant={activePackage.isActive ? "success" : "neutral"}
                      className={activePackage.isActive ? "bg-white/10 text-white" : ""}
                    >
                      {activePackage.isActive ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-white/78">{activePackage.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Price label</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activePackage.priceLabel}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Turnaround</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activePackage.turnaroundText}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Slug</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{activePackage.slug}</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-black/6 bg-surface-subtle p-4">
                    <p className="text-sm font-semibold text-foreground">Last updated</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {formatAdminDate(activePackage.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      setDrawerMode("edit");
                      setDrawerOpen(true);
                    }}
                  >
                    Edit selected package
                  </Button>
                  <Button variant="secondary" asChild>
                    <a href="/dashboard/accountant">Preview user-facing workspace</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-black/8 bg-surface-subtle p-6">
                <p className="font-display text-2xl font-bold text-foreground">Pick a package</p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Select a package from the left to inspect or edit it.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminPackageFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        initialPackage={drawerMode === "edit" ? activePackage : null}
        onOpenChange={setDrawerOpen}
        onSubmit={async (values) => {
          try {
            await mutatePackage(values);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong.");
          }
        }}
      />
    </div>
  );
}
