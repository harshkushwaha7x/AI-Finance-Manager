"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { transactionInputSchema } from "@/lib/validations/finance";
import type {
  TransactionCategoryOption,
  TransactionFormInput,
  TransactionInput,
  TransactionRecord,
} from "@/types/finance";

type TransactionFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  categories: TransactionCategoryOption[];
  initialTransaction?: TransactionRecord | null;
  lockedType?: TransactionInput["type"];
  titleOverride?: string;
  descriptionOverride?: string;
  submitLabelOverride?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransactionInput) => Promise<void>;
};

function getDefaultValues(
  transaction?: TransactionRecord | null,
  lockedType?: TransactionInput["type"],
): TransactionFormInput {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const transactionDate = `${today.getFullYear()}-${month}-${day}`;

  return {
    businessProfileId: transaction?.businessProfileId,
    categoryId: transaction?.categoryId,
    type: transaction?.type ?? lockedType ?? "expense",
    source: transaction?.source ?? "manual",
    title: transaction?.title ?? "",
    description: transaction?.description ?? "",
    merchantName: transaction?.merchantName ?? "",
    amount: transaction?.amount ?? 0,
    currency: transaction?.currency ?? "INR",
    transactionDate: transaction?.transactionDate ?? transactionDate,
    paymentMethod: transaction?.paymentMethod ?? "",
    status: transaction?.status ?? "cleared",
    recurring: transaction?.recurring ?? false,
    recurringInterval: transaction?.recurringInterval ?? "",
    notes: transaction?.notes ?? "",
  };
}

export function TransactionFormDrawer({
  open,
  mode,
  categories,
  initialTransaction,
  lockedType,
  titleOverride,
  descriptionOverride,
  submitLabelOverride,
  onOpenChange,
  onSubmit,
}: TransactionFormDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormInput, undefined, TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: getDefaultValues(initialTransaction, lockedType),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(initialTransaction, lockedType));
    }
  }, [initialTransaction, lockedType, open, reset]);

  const transactionType = useWatch({ control, name: "type" });
  const effectiveType = lockedType ?? transactionType;
  const isRecurring = useWatch({ control, name: "recurring" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const filteredCategories = categories.filter((category) =>
    effectiveType === "transfer" ? true : category.kind === effectiveType,
  );

  useEffect(() => {
    if (!lockedType) {
      return;
    }

    setValue("type", lockedType, { shouldDirty: false });
  }, [lockedType, setValue]);

  useEffect(() => {
    if (effectiveType === "transfer" || !selectedCategoryId) {
      return;
    }

    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

    if (selectedCategory && selectedCategory.kind !== effectiveType) {
      setValue("categoryId", undefined, { shouldDirty: true });
    }
  }, [categories, effectiveType, selectedCategoryId, setValue]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            {mode === "create" ? "New transaction" : "Edit transaction"}
          </p>
          <DrawerTitle>
            {titleOverride ??
              (mode === "create"
                ? "Capture a real finance event"
                : "Refine this ledger entry")}
          </DrawerTitle>
          <DrawerDescription>
            {descriptionOverride ??
              "This drawer now writes into the Day 8 transactions service, so the same pattern is ready for expenses, income, and receipt extraction review."}
          </DrawerDescription>
        </DrawerHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-5">
            <FormField label="Title" htmlFor="transaction-title" required error={errors.title?.message}>
              <Input
                id="transaction-title"
                placeholder={
                  lockedType === "expense"
                    ? "Software renewal or vendor spend"
                    : "Client payout or software renewal"
                }
                {...register("title")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              {lockedType ? (
                <div className="space-y-2 text-sm font-medium text-foreground">
                  <span>Type</span>
                  <div className="flex h-12 items-center rounded-2xl border border-border bg-surface-subtle px-4 text-sm text-foreground">
                    {lockedType.charAt(0).toUpperCase() + lockedType.slice(1)}
                  </div>
                </div>
              ) : (
                <FormField label="Type" htmlFor="transaction-type" required error={errors.type?.message}>
                  <Select id="transaction-type" {...register("type")}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </Select>
                </FormField>
              )}
              <FormField label="Category" htmlFor="transaction-category" error={errors.categoryId?.message}>
                <Select id="transaction-category" {...register("categoryId")}>
                  <option value="">Uncategorized</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Amount" htmlFor="transaction-amount" required error={errors.amount?.message}>
                <Input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="12500"
                  {...register("amount", { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="Date" htmlFor="transaction-date" required error={errors.transactionDate?.message}>
                <Input id="transaction-date" type="date" {...register("transactionDate")} />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Merchant" htmlFor="transaction-merchant" error={errors.merchantName?.message}>
                <Input
                  id="transaction-merchant"
                  placeholder="Vendor or client name"
                  {...register("merchantName")}
                />
              </FormField>
              <FormField label="Payment method" htmlFor="transaction-payment-method" error={errors.paymentMethod?.message}>
                <Input
                  id="transaction-payment-method"
                  placeholder="UPI, card, bank transfer"
                  {...register("paymentMethod")}
                />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Status" htmlFor="transaction-status" error={errors.status?.message}>
                <Select id="transaction-status" {...register("status")}>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                </Select>
              </FormField>
              <FormField label="Currency" htmlFor="transaction-currency" error={errors.currency?.message}>
                <Input id="transaction-currency" maxLength={3} placeholder="INR" {...register("currency")} />
              </FormField>
            </div>
            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-border accent-[var(--color-primary)]"
                  {...register("recurring")}
                />
                Mark as recurring
              </label>
              <p className="mt-2 text-sm leading-7 text-muted">
                Useful for retainers, rent, tool renewals, and reserved tax transfers.
              </p>
            </div>
            {isRecurring ? (
              <FormField
                label="Recurring interval"
                htmlFor="transaction-recurring-interval"
                error={errors.recurringInterval?.message}
              >
                <Input
                  id="transaction-recurring-interval"
                  placeholder="monthly"
                  {...register("recurringInterval")}
                />
              </FormField>
            ) : null}
            <FormField label="Description" htmlFor="transaction-description" error={errors.description?.message}>
              <Textarea
                id="transaction-description"
                className="min-h-28"
                placeholder="Optional bookkeeping context for this entry."
                {...register("description")}
              />
            </FormField>
            <FormField label="Notes" htmlFor="transaction-notes" error={errors.notes?.message}>
              <Textarea
                id="transaction-notes"
                className="min-h-32"
                placeholder="Internal notes, AI review hints, or follow-up reminders."
                {...register("notes")}
              />
            </FormField>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Saving..."
                  : "Updating..."
                : submitLabelOverride ??
                  (mode === "create" ? "Create transaction" : "Save changes")}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
