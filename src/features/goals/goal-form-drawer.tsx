"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { goalInputSchema } from "@/lib/validations/finance";
import type { GoalFormInput, GoalInput, GoalRecord } from "@/types/finance";

type GoalFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  initialGoal?: GoalRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoalInput) => Promise<void>;
};

function getDefaultValues(goal?: GoalRecord | null): GoalFormInput {
  return {
    title: goal?.title ?? "",
    description: goal?.description ?? "",
    targetAmount: goal?.targetAmount ?? 0,
    currentAmount: goal?.currentAmount ?? 0,
    targetDate: goal?.targetDate ?? "",
    priority: goal?.priority ?? "medium",
    status: goal?.status ?? "active",
    icon: goal?.icon ?? "",
  };
}

export function GoalFormDrawer({
  open,
  mode,
  initialGoal,
  onOpenChange,
  onSubmit,
}: GoalFormDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormInput, undefined, GoalInput>({
    resolver: zodResolver(goalInputSchema),
    defaultValues: getDefaultValues(initialGoal),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(initialGoal));
    }
  }, [initialGoal, open, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            {mode === "create" ? "New goal" : "Edit goal"}
          </p>
          <DrawerTitle>
            {mode === "create"
              ? "Create a goal with a visible savings path"
              : "Refine this goal target"}
          </DrawerTitle>
          <DrawerDescription>
            Goals now carry real progress, deadline pressure, and contribution history through the shared workspace state.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5">
            <FormField label="Goal title" htmlFor="goal-title" required error={errors.title?.message}>
              <Input id="goal-title" placeholder="Emergency fund or tax reserve" {...register("title")} />
            </FormField>
            <FormField label="Description" htmlFor="goal-description" error={errors.description?.message}>
              <Textarea
                id="goal-description"
                className="min-h-28"
                placeholder="What this goal protects or why it matters."
                {...register("description")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Target amount" htmlFor="goal-target-amount" required error={errors.targetAmount?.message}>
                <Input
                  id="goal-target-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="250000"
                  {...register("targetAmount", { valueAsNumber: true })}
                />
              </FormField>
              <FormField label="Current amount" htmlFor="goal-current-amount" required error={errors.currentAmount?.message}>
                <Input
                  id="goal-current-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50000"
                  {...register("currentAmount", { valueAsNumber: true })}
                />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Priority" htmlFor="goal-priority" error={errors.priority?.message}>
                <Select id="goal-priority" {...register("priority")}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </FormField>
              <FormField label="Status" htmlFor="goal-status" error={errors.status?.message}>
                <Select id="goal-status" {...register("status")}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormField>
              <FormField label="Icon label" htmlFor="goal-icon" error={errors.icon?.message}>
                <Input id="goal-icon" placeholder="shield" {...register("icon")} />
              </FormField>
            </div>
            <FormField label="Target date" htmlFor="goal-target-date" error={errors.targetDate?.message}>
              <Input id="goal-target-date" type="date" {...register("targetDate")} />
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
                : mode === "create"
                  ? "Create goal"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
