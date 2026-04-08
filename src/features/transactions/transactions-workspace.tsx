"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileText, PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTableShell } from "@/components/shared/data-table-shell";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategorizationReviewPanel } from "@/features/transactions/categorization-review-panel";
import { TransactionDetailsDialog } from "@/features/transactions/transaction-details-dialog";
import { TransactionFiltersPanel } from "@/features/transactions/transaction-filters";
import { TransactionFormDrawer } from "@/features/transactions/transaction-form-drawer";
import { TransactionRuleList } from "@/features/transactions/transaction-rule-list";
import { TransactionSummaryStrip } from "@/features/transactions/transaction-summary-strip";
import {
  applyTransactionFilters,
  buildTransactionSearchIndex,
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionStatusLabel,
  formatTransactionTypeLabel,
  getTransactionStatusVariant,
  getTransactionTypeVariant,
} from "@/features/transactions/transaction-utils";
import { transactionFiltersSchema } from "@/lib/validations/finance";
import type {
  TransactionFilters,
  TransactionInput,
  TransactionRecord,
  TransactionSummary,
  TransactionWorkspaceState,
} from "@/types/finance";

type TransactionsWorkspaceProps = {
  initialState: TransactionWorkspaceState;
};

type TransactionTableRow = TransactionRecord & {
  searchIndex: string;
  typeLabel: string;
};

type MutationPayload = {
  ok?: boolean;
  message?: string;
  transaction?: TransactionRecord;
  summary?: TransactionSummary;
  deletedId?: string;
};

export function TransactionsWorkspace({ initialState }: TransactionsWorkspaceProps) {
  const [transactions, setTransactions] = useState(initialState.transactions);
  const [summary, setSummary] = useState(initialState.summary);
  const [rules, setRules] = useState(initialState.rules);
  const [filters, setFilters] = useState<TransactionFilters>(
    transactionFiltersSchema.parse({}),
  );
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionRecord | null>(null);
  const [activeTransaction, setActiveTransaction] = useState<TransactionRecord | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionRecord | null>(null);
  const filteredTransactions = applyTransactionFilters(transactions, filters);
  const tableRows: TransactionTableRow[] = filteredTransactions.map((transaction) => ({
    ...transaction,
    searchIndex: buildTransactionSearchIndex(transaction),
    typeLabel: formatTransactionTypeLabel(transaction.type),
  }));

  const columns: ColumnDef<TransactionTableRow>[] = [
    {
      accessorKey: "title",
      header: "Title",
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
      accessorKey: "typeLabel",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={getTransactionTypeVariant(row.original.type)}>
          {formatTransactionTypeLabel(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getTransactionStatusVariant(row.original.status)}>
          {formatTransactionStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span
          className={`font-semibold ${
            row.original.type === "income" ? "text-success" : "text-foreground"
          }`}
        >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTransaction(row.original)}
          >
            <FileText className="h-4 w-4" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingTransaction(row.original);
              setIsDrawerOpen(true);
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTransactionToDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  async function handleCreate(values: TransactionInput) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || !payload.summary) {
      throw new Error(payload.message ?? "Unable to create the transaction.");
    }

    setTransactions((current) => [payload.transaction!, ...current]);
    setSummary(payload.summary);
    setIsDrawerOpen(false);
    setEditingTransaction(null);
    toast.success("Transaction created in the live Day 8 workspace.");
  }

  async function handleUpdate(values: TransactionInput) {
    if (!editingTransaction) {
      return;
    }

    const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.transaction || !payload.summary) {
      throw new Error(payload.message ?? "Unable to update the transaction.");
    }

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === payload.transaction!.id ? payload.transaction! : transaction,
      ),
    );
    setSummary(payload.summary);
    setActiveTransaction((current) => {
      if (!current || current.id !== payload.transaction!.id) {
        return current;
      }

      return payload.transaction!;
    });
    setIsDrawerOpen(false);
    setEditingTransaction(null);
    toast.success("Transaction updated.");
  }

  async function handleDelete() {
    if (!transactionToDelete) {
      return;
    }

    const response = await fetch(`/api/transactions/${transactionToDelete.id}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as MutationPayload;

    if (!response.ok || !payload.deletedId || !payload.summary) {
      throw new Error(payload.message ?? "Unable to delete the transaction.");
    }

    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== payload.deletedId),
    );
    setSummary(payload.summary);
    setActiveTransaction((current) =>
      current?.id === payload.deletedId ? null : current,
    );
    setEditingTransaction((current) =>
      current?.id === payload.deletedId ? null : current,
    );
    setTransactionToDelete(null);
    toast.success("Transaction removed from the ledger.");
  }

  function handleCategorizationApplied(payload: {
    transactions: TransactionRecord[];
    summary: TransactionSummary;
    rules: TransactionWorkspaceState["rules"];
  }) {
    setTransactions(payload.transactions);
    setSummary(payload.summary);
    setRules(payload.rules);
    setActiveTransaction((current) =>
      current ? payload.transactions.find((transaction) => transaction.id === current.id) ?? null : null,
    );
    setEditingTransaction((current) =>
      current ? payload.transactions.find((transaction) => transaction.id === current.id) ?? null : null,
    );
  }

  async function handleFormSubmit(values: TransactionInput) {
    try {
      if (editingTransaction) {
        await handleUpdate(values);
      } else {
        await handleCreate(values);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  async function handleDeleteConfirm() {
    try {
      await handleDelete();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Transactions"
        title="Operate a real ledger instead of a static product mock"
        description="This workspace now runs through a validated ledger API, supports create/edit/delete flows, and includes an AI categorization queue that can seed reusable automation rules."
        badge={initialState.source === "database" ? "Database live" : "Demo persistence live"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsInfoOpen(true)}>
              <FileText className="h-4 w-4" />
              API notes
            </Button>
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setIsDrawerOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New transaction
            </Button>
          </>
        }
      />
      <TransactionSummaryStrip summary={summary} />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
        <CategorizationReviewPanel
          transactions={transactions}
          rules={rules}
          queueCount={summary.categorizationQueueCount}
          onApplyComplete={handleCategorizationApplied}
        />
        <TransactionRuleList rules={rules} />
      </div>
      <TransactionFiltersPanel
        filters={filters}
        categories={initialState.categories}
        onFiltersChange={setFilters}
        onReset={() => setFilters(transactionFiltersSchema.parse({}))}
      />
      <DataTableShell
        title="Ledger"
        description="Search and filter real records, then edit or delete them without leaving the transactions workspace."
        data={tableRows}
        columns={columns}
        searchKey="searchIndex"
        searchPlaceholder="Search titles, categories, merchants, and notes"
        filterKey="typeLabel"
        filterLabel="Type"
        filterOptions={[
          { label: "Income", value: "Income" },
          { label: "Expense", value: "Expense" },
          { label: "Transfer", value: "Transfer" },
        ]}
        emptyTitle="No transactions match these filters"
        emptyDescription="Reset the status, category, or date range filters to bring more records back into the ledger."
      />
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Day 8 notes</p>
            <DialogTitle>Transactions now have a real backend contract</DialogTitle>
            <DialogDescription>
              The ledger uses transaction CRUD routes plus `POST /api/ai/categorize` for batch suggestions and approvals. When your database exists, Prisma is used automatically; until then, both transactions and categorization rules persist into secure demo cookies for portfolio walkthroughs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsInfoOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TransactionFormDrawer
        open={isDrawerOpen}
        mode={editingTransaction ? "edit" : "create"}
        categories={initialState.categories}
        initialTransaction={editingTransaction}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />
      <TransactionDetailsDialog
        open={Boolean(activeTransaction)}
        transaction={activeTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setActiveTransaction(null);
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(transactionToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionToDelete(null);
          }
        }}
        title="Delete this transaction?"
        description="This removes the record from the current ledger dataset. In demo mode it updates the secure cookie snapshot, and in database mode it deletes the stored transaction."
        confirmLabel="Delete transaction"
        tone="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
