"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { expenseQuickAddSchema } from "@/lib/validations/expenses";
import type { ExpenseQuickAddFormInput, ExpenseQuickAddInput } from "@/types/expenses";
import type { TransactionCategoryOption, TransactionInput } from "@/types/finance";

type ExpenseQuickAddCardProps = {
  categories: TransactionCategoryOption[];
  onSubmit: (values: TransactionInput) => Promise<void>;
};

function getDefaultValues(): ExpenseQuickAddInput {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return {
    title: "",
    categoryId: undefined,
    amount: 0,
    transactionDate: `${today.getFullYear()}-${month}-${day}`,
    merchantName: "",
    paymentMethod: "",
    recurring: false,
    recurringInterval: "",
    notes: "",
  };
}

export function ExpenseQuickAddCard({
  categories,
  onSubmit,
}: ExpenseQuickAddCardProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseQuickAddFormInput, undefined, ExpenseQuickAddInput>({
    resolver: zodResolver(expenseQuickAddSchema),
    defaultValues: getDefaultValues(),
  });
  const isRecurring = useWatch({ control, name: "recurring" });

  async function handleQuickAdd(values: ExpenseQuickAddInput) {
    await onSubmit({
      ...values,
      type: "expense",
      source: "manual",
      currency: "INR",
      status: "cleared",
      description: "",
    });

    reset(getDefaultValues());
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Quick add</p>
        <CardTitle>Log a new expense in under 20 seconds</CardTitle>
        <p className="text-sm leading-7 text-muted">
          Use this for fast capture. The detailed drawer is still available when you need fuller bookkeeping context.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit(handleQuickAdd)}>
        <CardContent className="space-y-5">
          <FormField label="Title" htmlFor="expense-quick-title" required error={errors.title?.message}>
            <Input
              id="expense-quick-title"
              placeholder="Software renewal or vendor bill"
              {...register("title")}
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Amount" htmlFor="expense-quick-amount" required error={errors.amount?.message}>
              <Input
                id="expense-quick-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="4200"
                {...register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Date" htmlFor="expense-quick-date" required error={errors.transactionDate?.message}>
              <Input id="expense-quick-date" type="date" {...register("transactionDate")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" htmlFor="expense-quick-category" error={errors.categoryId?.message}>
              <Select id="expense-quick-category" {...register("categoryId")}>
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Payment method" htmlFor="expense-quick-payment-method" error={errors.paymentMethod?.message}>
              <Input
                id="expense-quick-payment-method"
                placeholder="UPI, card, bank transfer"
                {...register("paymentMethod")}
              />
            </FormField>
          </div>
          <FormField label="Merchant" htmlFor="expense-quick-merchant" error={errors.merchantName?.message}>
            <Input
              id="expense-quick-merchant"
              placeholder="Vendor or service provider"
              {...register("merchantName")}
            />
          </FormField>
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
              Ideal for subscriptions, retained vendor payments, and monthly compliance reserves.
            </p>
          </div>
          {isRecurring ? (
            <FormField label="Recurring interval" htmlFor="expense-quick-interval" error={errors.recurringInterval?.message}>
              <Input
                id="expense-quick-interval"
                placeholder="monthly"
                {...register("recurringInterval")}
              />
            </FormField>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between border-t border-black/6 pt-6">
          <p className="text-sm leading-7 text-muted">Quick add defaults to a cleared manual expense in INR.</p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save expense"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
