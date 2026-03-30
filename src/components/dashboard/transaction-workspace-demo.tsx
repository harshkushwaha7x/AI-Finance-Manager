"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { PageHeader } from "@/components/shared/page-header";

type TransactionRow = {
  title: string;
  type: "Income" | "Expense";
  category: string;
  amount: string;
  status: "Cleared" | "Review" | "Pending";
  date: string;
};

const rows: TransactionRow[] = [
  {
    title: "Stripe client payout",
    type: "Income",
    category: "Retainer",
    amount: "INR 58,000",
    status: "Cleared",
    date: "2026-03-28",
  },
  {
    title: "AWS bill",
    type: "Expense",
    category: "Infrastructure",
    amount: "INR 6,240",
    status: "Review",
    date: "2026-03-26",
  },
  {
    title: "Figma subscription",
    type: "Expense",
    category: "Software",
    amount: "INR 1,299",
    status: "Cleared",
    date: "2026-03-24",
  },
  {
    title: "GST payment hold",
    type: "Expense",
    category: "Tax",
    amount: "INR 14,000",
    status: "Pending",
    date: "2026-03-22",
  },
  {
    title: "Workshop invoice",
    type: "Income",
    category: "Project",
    amount: "INR 22,500",
    status: "Cleared",
    date: "2026-03-20",
  },
];

const columns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.title}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === "Income" ? "success" : "secondary"}>{row.original.type}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const variant =
        row.original.status === "Cleared"
          ? "success"
          : row.original.status === "Pending"
            ? "warning"
            : "secondary";

      return <Badge variant={variant}>{row.original.status}</Badge>;
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.amount}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
  },
];

export function TransactionWorkspaceDemo() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Transactions"
        title="Prepare a reusable ledger UI before the CRUD layer lands"
        description="Day 5 upgrades this screen from a placeholder into a real product shell with a table system, modal notes, a side drawer pattern, and destructive-action confirmation."
        badge="System ready"
        actions={
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <FileText className="h-4 w-4" />
                  View table notes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transaction table build notes</DialogTitle>
                  <DialogDescription>
                    The table shell already supports search, filtering, sorting, pagination, and empty
                    states, which means Day 8 can focus on real data and CRUD instead of rebuilding page
                    scaffolding.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Looks good</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsDrawerOpen(true)}>
              <Plus className="h-4 w-4" />
              New transaction
            </Button>
            <Button variant="danger" onClick={() => setIsArchiveOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Archive review batch
            </Button>
          </>
        }
      />
      <DataTableShell
        title="Ledger preview"
        description="A reusable table wrapper that already feels like a real SaaS transaction workspace."
        data={rows}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Search merchants, payouts, or transaction names"
        filterKey="status"
        filterLabel="Status"
        filterOptions={[
          { label: "Cleared", value: "Cleared" },
          { label: "Review", value: "Review" },
          { label: "Pending", value: "Pending" },
        ]}
        emptyTitle="No transactions match these filters"
        emptyDescription="Adjust the search term or status filter to bring records back into view."
      />
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Quick add</p>
            <DrawerTitle>Add a transaction draft</DrawerTitle>
            <DrawerDescription>
              This drawer pattern will be reused for expenses, income, invoices, and document review forms.
            </DrawerDescription>
          </DrawerHeader>
          <div className="mt-8 space-y-5">
            <FormField label="Title" htmlFor="transaction-title" required>
              <Input id="transaction-title" placeholder="Client payout or vendor spend" />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Type" htmlFor="transaction-type" required>
                <Select id="transaction-type" defaultValue="Expense">
                  <option>Expense</option>
                  <option>Income</option>
                </Select>
              </FormField>
              <FormField label="Amount" htmlFor="transaction-amount" required>
                <Input id="transaction-amount" placeholder="INR 12,500" />
              </FormField>
            </div>
            <FormField label="Notes" htmlFor="transaction-notes" hint="This draft is a UI demo for Day 5.">
              <Textarea id="transaction-notes" className="min-h-32" placeholder="Add context for AI review or bookkeeping follow-up." />
            </FormField>
          </div>
          <div className="mt-auto flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Transaction drawer pattern is ready for CRUD wiring.");
                setIsDrawerOpen(false);
              }}
            >
              Save draft
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      <ConfirmDialog
        open={isArchiveOpen}
        onOpenChange={setIsArchiveOpen}
        title="Archive the review batch?"
        description="Use this destructive action pattern for bulk transaction review, admin pipelines, and document cleanup flows later."
        confirmLabel="Archive batch"
        tone="danger"
        onConfirm={() => toast.success("Confirm dialog pattern is ready for bulk actions.")}
      />
    </div>
  );
}
