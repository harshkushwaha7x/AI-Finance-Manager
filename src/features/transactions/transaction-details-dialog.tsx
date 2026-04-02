"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionStatusLabel,
  formatTransactionTypeLabel,
  getTransactionStatusVariant,
  getTransactionTypeVariant,
} from "@/features/transactions/transaction-utils";
import type { TransactionRecord } from "@/types/finance";

type TransactionDetailsDialogProps = {
  transaction: TransactionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-black/6 bg-surface-subtle p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-7 text-foreground">{value}</p>
    </div>
  );
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsDialogProps) {
  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Ledger detail</p>
          <DialogTitle>{transaction.title}</DialogTitle>
          <DialogDescription>
            Review merchant context, bookkeeping notes, and the exact fields that will later feed AI categorization.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge variant={getTransactionTypeVariant(transaction.type)}>
            {formatTransactionTypeLabel(transaction.type)}
          </Badge>
          <Badge variant={getTransactionStatusVariant(transaction.status)}>
            {formatTransactionStatusLabel(transaction.status)}
          </Badge>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Amount"
            value={formatTransactionAmount(transaction.amount, transaction.currency)}
          />
          <DetailItem label="Date" value={formatTransactionDate(transaction.transactionDate)} />
          <DetailItem label="Category" value={transaction.categoryLabel} />
          <DetailItem
            label="Merchant"
            value={transaction.merchantName || "No merchant attached"}
          />
          <DetailItem
            label="Payment method"
            value={transaction.paymentMethod || "Not added yet"}
          />
          <DetailItem
            label="Recurring"
            value={
              transaction.recurring
                ? transaction.recurringInterval || "Recurring"
                : "One-time entry"
            }
          />
        </div>
        <div className="mt-4 rounded-[1.5rem] border border-black/6 bg-surface-subtle p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Notes</p>
          <p className="mt-3 text-sm leading-8 text-foreground">
            {transaction.notes || transaction.description || "No notes have been added to this record yet."}
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
