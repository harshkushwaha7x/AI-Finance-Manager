"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetAlertPanel } from "@/features/budgets/budget-alert-panel";
import { BudgetCardGrid } from "@/features/budgets/budget-card-grid";
import { BudgetFiltersPanel } from "@/features/budgets/budget-filters-panel";
import { BudgetFocusPanel } from "@/features/budgets/budget-focus-panel";
import { BudgetFormDrawer } from "@/features/budgets/budget-form-drawer";
import { BudgetSavedViews } from "@/features/budgets/budget-saved-views";
import { BudgetSummaryStrip } from "@/features/budgets/budget-summary-strip";
import {
  applyBudgetPageFilters,
  applyBudgetSavedView,
  buildBudgetAlerts,
  buildBudgetSavedViews,
  buildBudgetSummary,
} from "@/features/budgets/budget-utils";
import { emitNotificationsChanged } from "@/lib/utils/notification-events";
import type {
  BudgetInput,
  BudgetRecord,
  BudgetWorkspaceState,
} from "@/types/finance";
import type {
  BudgetPageFilters,
  BudgetSavedViewId,
} from "@/types/budgets";

type BudgetsWorkspaceProps = {
  initialState: BudgetWorkspaceState;
};

type MutationPayload = {
  ok?: boolean;
  message?: string;
  budget?: BudgetRecord;
  budgets?: BudgetRecord[];
  deletedId?: string;
};

const defaultBudgetPageFilters: BudgetPageFilters = {
  category: "all",
  period: "all",
  status: "all",
};

export function BudgetsWorkspace({ initialState }: BudgetsWorkspaceProps) {
  const [budgets, setBudgets] = useState(initialState.budgets);
  const [pageFilters, setPageFilters] = useState<BudgetPageFilters>(defaultBudgetPageFilters);
  const [activeView, setActiveView] = useState<BudgetSavedViewId>("all");
  const [activeBudget, setActiveBudget] = useState<BudgetRecord | null>(
    initialState.alerts[0]
      ? initialState.budgets.find((budget) => budget.id === initialState.alerts[0].budgetId) ?? null
      : initialState.budgets[0] ?? null,
  );
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const summary = useMemo(() => buildBudgetSummary(budgets), [budgets]);
  const alerts = useMemo(() => buildBudgetAlerts(budgets), [budgets]);
  const savedViews = useMemo(() => buildBudgetSavedViews(budgets), [budgets]);
  const visibleBudgets = useMemo(
    () => applyBudgetPageFilters(applyBudgetSavedView(budgets, activeView), pageFilters),
    [activeView, budgets, pageFilters],
  );

  async function createBudgetRecord(values: BudgetInput) {
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.budget || !payload.budgets) {
      throw new Error(payload.message ?? "Unable to create the budget.");
    }

    setBudgets(payload.budgets);
    setActiveBudget(payload.budget);
    setIsDrawerOpen(false);
    setEditingBudget(null);
    emitNotificationsChanged();
    toast.success("Budget created.");
  }

  async function updateBudgetRecord(values: BudgetInput) {
    if (!editingBudget) {
      return;
    }

    const response = await fetch(`/api/budgets/${editingBudget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.budget || !payload.budgets) {
      throw new Error(payload.message ?? "Unable to update the budget.");
    }

    setBudgets(payload.budgets);
    setActiveBudget(payload.budget);
    setEditingBudget(null);
    setIsDrawerOpen(false);
    emitNotificationsChanged();
    toast.success("Budget updated.");
  }

  async function deleteBudgetRecord() {
    if (!budgetToDelete) {
      return;
    }

    const response = await fetch(`/api/budgets/${budgetToDelete.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.deletedId || !payload.budgets) {
      throw new Error(payload.message ?? "Unable to delete the budget.");
    }

    setBudgets(payload.budgets);
    setActiveBudget((current) => {
      if (!current || current.id !== payload.deletedId) {
        return current;
      }

      return payload.budgets?.[0] ?? null;
    });
    setEditingBudget((current) => (current?.id === payload.deletedId ? null : current));
    setBudgetToDelete(null);
    emitNotificationsChanged();
    toast.success("Budget deleted.");
  }

  async function handleBudgetSubmit(values: BudgetInput) {
    try {
      if (editingBudget) {
        await updateBudgetRecord(values);
      } else {
        await createBudgetRecord(values);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteBudgetRecord();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Budgets"
        title="Turn budget pressure into something you can actually act on"
        description="The budgets module now tracks real expense utilization by category and date window, surfaces watchlist alerts, and gives the dashboard a genuine planning layer instead of a placeholder."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setEditingBudget(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New budget
          </Button>
        }
      />
      <BudgetSummaryStrip summary={summary} />
      <BudgetSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <BudgetAlertPanel alerts={alerts} />
        <BudgetFocusPanel budget={activeBudget} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <BudgetCardGrid
          budgets={visibleBudgets}
          activeBudgetId={activeBudget?.id}
          onSelect={setActiveBudget}
          onEdit={(budget) => {
            setEditingBudget(budget);
            setActiveBudget(budget);
            setIsDrawerOpen(true);
          }}
          onDelete={(budget) => setBudgetToDelete(budget)}
        />
        <BudgetFiltersPanel
          filters={pageFilters}
          categories={initialState.categories}
          onFiltersChange={setPageFilters}
          onReset={() => setPageFilters(defaultBudgetPageFilters)}
        />
      </section>
      <BudgetFormDrawer
        open={isDrawerOpen}
        mode={editingBudget ? "edit" : "create"}
        categories={initialState.categories}
        initialBudget={editingBudget}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setEditingBudget(null);
          }
        }}
        onSubmit={handleBudgetSubmit}
      />
      <ConfirmDialog
        open={Boolean(budgetToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setBudgetToDelete(null);
          }
        }}
        title="Delete this budget?"
        description="This removes the planning rule and immediately updates the budget dashboard, alerts, and utilization totals."
        confirmLabel="Delete budget"
        tone="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
