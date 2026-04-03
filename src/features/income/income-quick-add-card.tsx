"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { incomeQuickAddSchema } from "@/lib/validations/income";
import type {
  IncomeQuickAddFormInput,
  IncomeQuickAddInput,
} from "@/types/income";
import type { TransactionCategoryOption, TransactionInput } from "@/types/finance";

type IncomeQuickAddCardProps = {
  categories: TransactionCategoryOption[];
  onSubmit: (values: TransactionInput) => Promise<void>;
};

function getDefaultValues(): IncomeQuickAddInput {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return {
    title: "",
    categoryId: undefined,
    amount: 0,
    transactionDate: `${today.getFullYear()}-${month}-${day}`,
    source: "manual",
    merchantName: "",
    paymentMethod: "",
    status: "cleared",
    recurring: false,
    recurringInterval: "",
    notes: "",
  };
}

export function IncomeQuickAddCard({
  categories,
  onSubmit,
}: IncomeQuickAddCardProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IncomeQuickAddFormInput, undefined, IncomeQuickAddInput>({
    resolver: zodResolver(incomeQuickAddSchema),
    defaultValues: getDefaultValues(),
  });
  const isRecurring = useWatch({ control, name: "recurring" });

  async function handleQuickAdd(values: IncomeQuickAddInput) {
    await onSubmit({
      ...values,
      type: "income",
      currency: "INR",
      description: "",
    });

    reset(getDefaultValues());
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Quick add</p>
        <CardTitle>Capture income before it slips out of view</CardTitle>
        <p className="text-sm leading-7 text-muted">
          Ideal for retainers, salary credits, invoice settlements, and one-off project payments.
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit(handleQuickAdd)}>
        <CardContent className="space-y-5">
          <FormField label="Title" htmlFor="income-quick-title" required error={errors.title?.message}>
            <Input
              id="income-quick-title"
              placeholder="Client payout or salary credit"
              {...register("title")}
            />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Amount" htmlFor="income-quick-amount" required error={errors.amount?.message}>
              <Input
                id="income-quick-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="58000"
                {...register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Date" htmlFor="income-quick-date" required error={errors.transactionDate?.message}>
              <Input id="income-quick-date" type="date" {...register("transactionDate")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" htmlFor="income-quick-category" error={errors.categoryId?.message}>
              <Select id="income-quick-category" {...register("categoryId")}>
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Source" htmlFor="income-quick-source" error={errors.source?.message}>
              <Select id="income-quick-source" {...register("source")}>
                <option value="manual">Manual entry</option>
                <option value="invoice">Invoice linked</option>
                <option value="ai">AI import</option>
              </Select>
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Payer / client" htmlFor="income-quick-merchant" error={errors.merchantName?.message}>
              <Input
                id="income-quick-merchant"
                placeholder="Client or employer name"
                {...register("merchantName")}
              />
            </FormField>
            <FormField label="Received via" htmlFor="income-quick-payment-method" error={errors.paymentMethod?.message}>
              <Input
                id="income-quick-payment-method"
                placeholder="Bank transfer, UPI, card"
                {...register("paymentMethod")}
              />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Status" htmlFor="income-quick-status" error={errors.status?.message}>
              <Select id="income-quick-status" {...register("status")}>
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
              </Select>
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
                Great for retainers, salary-like income, and predictable monthly credits.
              </p>
            </div>
          </div>
          {isRecurring ? (
            <FormField label="Recurring interval" htmlFor="income-quick-interval" error={errors.recurringInterval?.message}>
              <Input
                id="income-quick-interval"
                placeholder="monthly"
                {...register("recurringInterval")}
              />
            </FormField>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between border-t border-black/6 pt-6">
          <p className="text-sm leading-7 text-muted">
            Quick add supports invoice-linked and pending income without opening the full drawer.
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save income"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
