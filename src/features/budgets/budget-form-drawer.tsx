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
import { budgetInputSchema } from "@/lib/validations/finance";
import type {
  BudgetFormInput,
  BudgetInput,
  BudgetRecord,
  TransactionCategoryOption,
} from "@/types/finance";

type BudgetFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  categories: TransactionCategoryOption[];
  initialBudget?: BudgetRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BudgetInput) => Promise<void>;
};

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRangeForPeriod(period: BudgetInput["period"]) {
  const today = new Date();

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    return {
      startDate: formatLocalDate(new Date(today.getFullYear(), quarterStartMonth, 1)),
      endDate: formatLocalDate(new Date(today.getFullYear(), quarterStartMonth + 3, 0)),
    };
  }

  if (period === "yearly") {
    return {
      startDate: formatLocalDate(new Date(today.getFullYear(), 0, 1)),
      endDate: formatLocalDate(new Date(today.getFullYear(), 11, 31)),
    };
  }

  return {
    startDate: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
  };
}

function getDefaultValues(budget?: BudgetRecord | null): BudgetFormInput {
  const range = getRangeForPeriod(budget?.period ?? "monthly");

  return {
    businessProfileId: budget?.businessProfileId,
    categoryId: budget?.categoryId,
    name: budget?.name ?? "",
    limitAmount: budget?.limitAmount ?? 0,
    period: budget?.period ?? "monthly",
    startDate: budget?.startDate ?? range.startDate,
    endDate: budget?.endDate ?? range.endDate,
    alertPercent: budget?.alertPercent ?? 80,
    carryForward: budget?.carryForward ?? false,
  };
}

export function BudgetFormDrawer({
  open,
  mode,
  categories,
  initialBudget,
  onOpenChange,
  onSubmit,
}: BudgetFormDrawerProps) {
  const {
    register,
    reset,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, undefined, BudgetInput>({
    resolver: zodResolver(budgetInputSchema),
    defaultValues: getDefaultValues(initialBudget),
  });

  const selectedPeriod = useWatch({ control, name: "period" });
  const expenseCategories = categories.filter((category) => category.kind === "expense");

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(initialBudget));
    }
  }, [initialBudget, open, reset]);

  useEffect(() => {
    if (initialBudget || !selectedPeriod) {
      return;
    }

    const range = getRangeForPeriod(selectedPeriod);
    setValue("startDate", range.startDate, { shouldDirty: true });
    setValue("endDate", range.endDate, { shouldDirty: true });
  }, [initialBudget, selectedPeriod, setValue]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            {mode === "create" ? "New budget" : "Edit budget"}
          </p>
          <DrawerTitle>
            {mode === "create"
              ? "Create a budget with real threshold logic"
              : "Refine this budget rule"}
          </DrawerTitle>
          <DrawerDescription>
            Budgets are now computed against the live expense ledger, so every change immediately updates utilization, alerts, and the dashboard planning widgets.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5">
            <FormField label="Budget name" htmlFor="budget-name" required error={errors.name?.message}>
              <Input
                id="budget-name"
                placeholder="Operations stack or food budget"
                {...register("name")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Category" htmlFor="budget-category" error={errors.categoryId?.message}>
                <Select id="budget-category" {...register("categoryId")}>
                  <option value="">Uncategorized spend</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Period" htmlFor="budget-period" required error={errors.period?.message}>
                <Select id="budget-period" {...register("period")}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Limit amount"
                htmlFor="budget-limit-amount"
                required
                error={errors.limitAmount?.message}
              >
                <Input
                  id="budget-limit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25000"
                  {...register("limitAmount", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Alert threshold"
                htmlFor="budget-alert-percent"
                required
                hint="This controls when the budget switches from healthy to watch."
                error={errors.alertPercent?.message}
              >
                <Input
                  id="budget-alert-percent"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="80"
                  {...register("alertPercent", { valueAsNumber: true })}
                />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Start date"
                htmlFor="budget-start-date"
                required
                error={errors.startDate?.message}
              >
                <Input id="budget-start-date" type="date" {...register("startDate")} />
              </FormField>
              <FormField
                label="End date"
                htmlFor="budget-end-date"
                required
                error={errors.endDate?.message}
              >
                <Input id="budget-end-date" type="date" {...register("endDate")} />
              </FormField>
            </div>
            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-border accent-[var(--color-primary)]"
                  {...register("carryForward")}
                />
                Carry unused budget forward
              </label>
              <p className="mt-2 text-sm leading-7 text-muted">
                Keep this on for tax reserves or longer planning buckets that should absorb month-to-month variance.
              </p>
            </div>
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
                : mode === "create"
                  ? "Create budget"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
