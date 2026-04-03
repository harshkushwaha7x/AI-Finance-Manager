"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTableShell } from "@/components/shared/data-table-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IncomeFiltersPanel } from "@/features/income/income-filters-panel";
import { IncomeQuickAddCard } from "@/features/income/income-quick-add-card";
import { IncomeSavedViews } from "@/features/income/income-saved-views";
import { IncomeSourceBreakdown } from "@/features/income/income-source-breakdown";
import { IncomeSummaryStrip } from "@/features/income/income-summary-strip";
import { IncomeTrendChart } from "@/features/income/income-trend-chart";
import { RecurringIncomePanel } from "@/features/income/recurring-income-panel";
import {
  applyIncomePageFilters,
  applyIncomeSavedView,
  buildIncomeSavedViews,
  buildIncomeSourceBreakdown,
  buildIncomeSummary,
  buildIncomeTrend,
  getRecurringIncome,
} from "@/features/income/income-utils";
import { TransactionDetailsDialog } from "@/features/transactions/transaction-details-dialog";
import { TransactionFormDrawer } from "@/features/transactions/transaction-form-drawer";
import {
  buildTransactionSearchIndex,
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionSourceLabel,
  formatTransactionStatusLabel,
  getTransactionStatusVariant,
} from "@/features/transactions/transaction-utils";
import type {
  IncomePageFilters,
  IncomeSavedViewId,
  IncomeWorkspaceState,
} from "@/types/income";
import type { TransactionInput, TransactionRecord } from "@/types/finance";

type IncomeWorkspaceProps = {
  initialState: IncomeWorkspaceState;
};

type IncomeTableRow = TransactionRecord & {
  searchIndex: string;
  statusLabel: string;
  sourceLabel: string;
};

type MutationPayload = {
  ok?: boolean;
  message?: string;
  transaction?: TransactionRecord;
  deletedId?: string;
};

const defaultIncomePageFilters: IncomePageFilters = {
  category: "all",
  source: "all",
  dateFrom: "",
  dateTo: "",
};

export function IncomeWorkspace({ initialState }: IncomeWorkspaceProps) {
  const [incomes, setIncomes] = useState(initialState.incomes);
  const [pageFilters, setPageFilters] = useState<IncomePageFilters>(defaultIncomePageFilters);
  const [activeView, setActiveView] = useState<IncomeSavedViewId>("all");
  const [activeIncome, setActiveIncome] = useState<TransactionRecord | null>(null);
  const [editingIncome, setEditingIncome] = useState<TransactionRecord | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<TransactionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const breakdown = buildIncomeSourceBreakdown(incomes);
  const summary = buildIncomeSummary(incomes, breakdown);
  const recurringIncome = getRecurringIncome(incomes);
  const savedViews = buildIncomeSavedViews(incomes);
  const trend = buildIncomeTrend(incomes);
  const visibleIncome = applyIncomePageFilters(
    applyIncomeSavedView(incomes, activeView),
    pageFilters,
  );
  const tableRows: IncomeTableRow[] = visibleIncome.map((income) => ({
    ...income,
    searchIndex: buildTransactionSearchIndex(income),
    statusLabel: formatTransactionStatusLabel(income.status),
    sourceLabel: formatTransactionSourceLabel(income.source),
  }));

  const columns: ColumnDef<IncomeTableRow>[] = [
    {
      accessorKey: "title",
      header: "Income",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
            {row.original.categoryLabel}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "sourceLabel",
      header: "Source",
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-foreground">{row.original.sourceLabel}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
            {row.original.merchantName || "Payer not added"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "statusLabel",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-2">
          <Badge variant={getTransactionStatusVariant(row.original.status)}>
            {row.original.statusLabel}
          </Badge>
          {row.original.recurring ? (
            <Badge variant="secondary">{row.original.recurringInterval || "Recurring"}</Badge>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold text-success">
          {formatTransactionAmount(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      accessorKey: "transactionDate",
      header: "Date",
      cell: ({ row }) => formatTransactionDate(row.original.transactionDate),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveIncome(row.original)}>
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingIncome(row.original);
              setIsDrawerOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIncomeToDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  async function createIncome(values: TransactionInput) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || payload.transaction.type !== "income") {
      throw new Error(payload.message ?? "Unable to create the income entry.");
    }

    setIncomes((current) => [payload.transaction!, ...current]);
    setIsDrawerOpen(false);
    setEditingIncome(null);
    toast.success("Income added to the live cash-in workspace.");
  }

  async function updateIncome(values: TransactionInput) {
    if (!editingIncome) {
      return;
    }

    const response = await fetch(`/api/transactions/${editingIncome.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || payload.transaction.type !== "income") {
      throw new Error(payload.message ?? "Unable to update the income entry.");
    }

    setIncomes((current) =>
      current.map((income) =>
        income.id === payload.transaction!.id ? payload.transaction! : income,
      ),
    );
    setActiveIncome((current) => {
      if (!current || current.id !== payload.transaction!.id) {
        return current;
      }

      return payload.transaction!;
    });
    setEditingIncome(null);
    setIsDrawerOpen(false);
    toast.success("Income updated.");
  }

  async function deleteIncome() {
    if (!incomeToDelete) {
      return;
    }

    const response = await fetch(`/api/transactions/${incomeToDelete.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.deletedId) {
      throw new Error(payload.message ?? "Unable to delete the income entry.");
    }

    setIncomes((current) => current.filter((income) => income.id !== payload.deletedId));
    setActiveIncome((current) => (current?.id === payload.deletedId ? null : current));
    setEditingIncome((current) => (current?.id === payload.deletedId ? null : current));
    setIncomeToDelete(null);
    toast.success("Income removed.");
  }

  async function handleIncomeSubmit(values: TransactionInput) {
    try {
      if (editingIncome) {
        await updateIncome(values);
      } else {
        await createIncome(values);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteIncome();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Income"
        title="Run a clearer cash-in workflow"
        description="This page focuses on incoming money, invoice-linked collections, recurring inflow, and a cleaner view of what has cleared versus what still needs follow-up."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setEditingIncome(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Detailed income
          </Button>
        }
      />
      <IncomeSummaryStrip summary={summary} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <IncomeQuickAddCard categories={initialState.categories} onSubmit={createIncome} />
        <RecurringIncomePanel recurringIncome={recurringIncome} summary={summary} />
      </section>
      <IncomeSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <IncomeTrendChart data={trend} />
        <IncomeSourceBreakdown breakdown={breakdown} />
      </section>
      <IncomeFiltersPanel
        filters={pageFilters}
        categories={initialState.categories}
        onFiltersChange={setPageFilters}
        onReset={() => setPageFilters(defaultIncomePageFilters)}
      />
      <DataTableShell
        title="Income ledger"
        description="Review source, payer, recurring status, and pending cash-in without leaving the income workflow."
        data={tableRows}
        columns={columns}
        searchKey="searchIndex"
        searchPlaceholder="Search titles, sources, payer names, and notes"
        filterKey="statusLabel"
        filterLabel="Status"
        filterOptions={[
          { label: "Cleared", value: "Cleared" },
          { label: "Pending", value: "Pending" },
        ]}
        emptyTitle="No income records match these filters"
        emptyDescription="Reset the saved view or source/date filters to bring more cash-in entries back into focus."
      />
      <TransactionFormDrawer
        open={isDrawerOpen}
        mode={editingIncome ? "edit" : "create"}
        categories={initialState.categories}
        initialTransaction={editingIncome}
        lockedType="income"
        showSourceField
        sourceLabelOverride="Income source"
        sourceOptions={[
          { label: "Manual entry", value: "manual" },
          { label: "Invoice linked", value: "invoice" },
          { label: "AI import", value: "ai" },
        ]}
        titleOverride={editingIncome ? "Update this income entry" : "Capture a detailed income entry"}
        descriptionOverride="Use the full form when you need richer source, payer, status, recurring, and note fields for income tracking."
        merchantLabelOverride="Payer / client"
        merchantPlaceholderOverride="Client or employer name"
        paymentMethodLabelOverride="Received via"
        paymentMethodPlaceholderOverride="Bank transfer, UPI, card"
        submitLabelOverride={editingIncome ? "Save income changes" : "Create income"}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setEditingIncome(null);
          }
        }}
        onSubmit={handleIncomeSubmit}
      />
      <TransactionDetailsDialog
        open={Boolean(activeIncome)}
        transaction={activeIncome}
        onOpenChange={(open) => {
          if (!open) {
            setActiveIncome(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(incomeToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setIncomeToDelete(null);
          }
        }}
        title="Delete this income entry?"
        description="This removes the income record from the current ledger dataset and updates the income page totals immediately."
        confirmLabel="Delete income"
        tone="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
