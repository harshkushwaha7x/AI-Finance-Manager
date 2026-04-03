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
import { TransactionDetailsDialog } from "@/features/transactions/transaction-details-dialog";
import { TransactionFormDrawer } from "@/features/transactions/transaction-form-drawer";
import { ExpenseCategoryBreakdown } from "@/features/expenses/expense-category-breakdown";
import { ExpenseFiltersPanel } from "@/features/expenses/expense-filters-panel";
import { ExpenseQuickAddCard } from "@/features/expenses/expense-quick-add-card";
import { ExpenseSavedViews } from "@/features/expenses/expense-saved-views";
import { ExpenseSummaryStrip } from "@/features/expenses/expense-summary-strip";
import { RecurringExpensePanel } from "@/features/expenses/recurring-expense-panel";
import {
  applyExpensePageFilters,
  applyExpenseSavedView,
  buildExpenseBreakdown,
  buildExpenseSavedViews,
  buildExpenseSummary,
  getRecurringExpenses,
} from "@/features/expenses/expense-utils";
import {
  buildTransactionSearchIndex,
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionStatusLabel,
  getTransactionStatusVariant,
} from "@/features/transactions/transaction-utils";
import type {
  ExpensePageFilters,
  ExpenseSavedViewId,
  ExpenseWorkspaceState,
} from "@/types/expenses";
import type { TransactionInput, TransactionRecord } from "@/types/finance";

type ExpensesWorkspaceProps = {
  initialState: ExpenseWorkspaceState;
};

type ExpenseTableRow = TransactionRecord & {
  searchIndex: string;
  statusLabel: string;
};

type MutationPayload = {
  ok?: boolean;
  message?: string;
  transaction?: TransactionRecord;
  summary?: unknown;
  deletedId?: string;
};

const defaultExpensePageFilters: ExpensePageFilters = {
  category: "all",
  dateFrom: "",
  dateTo: "",
};

export function ExpensesWorkspace({ initialState }: ExpensesWorkspaceProps) {
  const [expenses, setExpenses] = useState(initialState.expenses);
  const [pageFilters, setPageFilters] = useState<ExpensePageFilters>(defaultExpensePageFilters);
  const [activeView, setActiveView] = useState<ExpenseSavedViewId>("all");
  const [activeExpense, setActiveExpense] = useState<TransactionRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<TransactionRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<TransactionRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const expenseSummary = buildExpenseSummary(
    expenses,
    buildExpenseBreakdown(expenses, initialState.categories),
  );
  const breakdown = buildExpenseBreakdown(expenses, initialState.categories);
  const recurringExpenses = getRecurringExpenses(expenses);
  const savedViews = buildExpenseSavedViews(expenses);
  const visibleExpenses = applyExpensePageFilters(
    applyExpenseSavedView(expenses, activeView),
    pageFilters,
  );
  const tableRows: ExpenseTableRow[] = visibleExpenses.map((expense) => ({
    ...expense,
    searchIndex: buildTransactionSearchIndex(expense),
    statusLabel: formatTransactionStatusLabel(expense.status),
  }));

  const columns: ColumnDef<ExpenseTableRow>[] = [
    {
      accessorKey: "title",
      header: "Expense",
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
      accessorKey: "merchantName",
      header: "Merchant",
      cell: ({ row }) => (
        <div>
          <p className="text-sm text-foreground">
            {row.original.merchantName || "Not added"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
            {row.original.paymentMethod || "Payment method pending"}
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
            {formatTransactionStatusLabel(row.original.status)}
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
        <span className="font-semibold text-foreground">
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
          <Button variant="ghost" size="sm" onClick={() => setActiveExpense(row.original)}>
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingExpense(row.original);
              setIsDrawerOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpenseToDelete(row.original)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  async function createExpense(values: TransactionInput) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || payload.transaction.type !== "expense") {
      throw new Error(payload.message ?? "Unable to create the expense.");
    }

    setExpenses((current) => [payload.transaction!, ...current]);
    setIsDrawerOpen(false);
    setEditingExpense(null);
    toast.success("Expense added to the live ledger.");
  }

  async function updateExpense(values: TransactionInput) {
    if (!editingExpense) {
      return;
    }

    const response = await fetch(`/api/transactions/${editingExpense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || payload.transaction.type !== "expense") {
      throw new Error(payload.message ?? "Unable to update the expense.");
    }

    setExpenses((current) =>
      current.map((expense) =>
        expense.id === payload.transaction!.id ? payload.transaction! : expense,
      ),
    );
    setActiveExpense((current) => {
      if (!current || current.id !== payload.transaction!.id) {
        return current;
      }

      return payload.transaction!;
    });
    setEditingExpense(null);
    setIsDrawerOpen(false);
    toast.success("Expense updated.");
  }

  async function deleteExpense() {
    if (!expenseToDelete) {
      return;
    }

    const response = await fetch(`/api/transactions/${expenseToDelete.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.deletedId) {
      throw new Error(payload.message ?? "Unable to delete the expense.");
    }

    setExpenses((current) =>
      current.filter((expense) => expense.id !== payload.deletedId),
    );
    setActiveExpense((current) =>
      current?.id === payload.deletedId ? null : current,
    );
    setEditingExpense((current) =>
      current?.id === payload.deletedId ? null : current,
    );
    setExpenseToDelete(null);
    toast.success("Expense removed.");
  }

  async function handleExpenseSubmit(values: TransactionInput) {
    try {
      if (editingExpense) {
        await updateExpense(values);
      } else {
        await createExpense(values);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteExpense();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Expenses"
        title="Run a faster outgoing-spend workflow"
        description="This page now focuses specifically on quick expense capture, recurring commitments, category pressure, and a cleaner review surface for real bookkeeping work."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <Button
            onClick={() => {
              setEditingExpense(null);
              setIsDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Detailed expense
          </Button>
        }
      />
      <ExpenseSummaryStrip summary={expenseSummary} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ExpenseQuickAddCard categories={initialState.categories} onSubmit={createExpense} />
        <RecurringExpensePanel recurringExpenses={recurringExpenses} summary={expenseSummary} />
      </section>
      <ExpenseSavedViews views={savedViews} activeView={activeView} onSelect={setActiveView} />
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ExpenseCategoryBreakdown breakdown={breakdown} />
        <ExpenseFiltersPanel
          filters={pageFilters}
          categories={initialState.categories}
          onFiltersChange={setPageFilters}
          onReset={() => setPageFilters(defaultExpensePageFilters)}
        />
      </section>
      <DataTableShell
        title="Expense ledger"
        description="Review merchant metadata, payment methods, and recurring tags without leaving the expense workflow."
        data={tableRows}
        columns={columns}
        searchKey="searchIndex"
        searchPlaceholder="Search merchants, categories, notes, and payment methods"
        filterKey="statusLabel"
        filterLabel="Status"
        filterOptions={[
          { label: "Cleared", value: "Cleared" },
          { label: "Pending", value: "Pending" },
        ]}
        emptyTitle="No expenses match these filters"
        emptyDescription="Reset the saved view or date filters to bring more expense records back into focus."
      />
      <TransactionFormDrawer
        open={isDrawerOpen}
        mode={editingExpense ? "edit" : "create"}
        categories={initialState.categories}
        initialTransaction={editingExpense}
        lockedType="expense"
        titleOverride={
          editingExpense ? "Update this expense entry" : "Capture a detailed expense"
        }
        descriptionOverride="Use the full form when you need richer vendor, payment, recurring, and note fields for expense tracking."
        submitLabelOverride={editingExpense ? "Save expense changes" : "Create expense"}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setEditingExpense(null);
          }
        }}
        onSubmit={handleExpenseSubmit}
      />
      <TransactionDetailsDialog
        open={Boolean(activeExpense)}
        transaction={activeExpense}
        onOpenChange={(open) => {
          if (!open) {
            setActiveExpense(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(expenseToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setExpenseToDelete(null);
          }
        }}
        title="Delete this expense?"
        description="This permanently removes the expense from the current ledger dataset and updates the expense page totals immediately."
        confirmLabel="Delete expense"
        tone="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
