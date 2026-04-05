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
import { goalContributionInputSchema } from "@/lib/validations/finance";
import type { GoalContributionFormInput, GoalContributionInput, GoalRecord } from "@/types/finance";

type GoalContributionDrawerProps = {
  open: boolean;
  goal?: GoalRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoalContributionInput) => Promise<void>;
};

export function GoalContributionDrawer({
  open,
  goal,
  onOpenChange,
  onSubmit,
}: GoalContributionDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GoalContributionFormInput, undefined, GoalContributionInput>({
    resolver: zodResolver(goalContributionInputSchema),
    defaultValues: { amount: 0 },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: 0 });
    }
  }, [open, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Contribution</p>
          <DrawerTitle>Add progress to {goal?.title ?? "this goal"}</DrawerTitle>
          <DrawerDescription>
            Record a contribution to move the goal forward without editing the whole target.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5">
            <FormField
              label="Contribution amount"
              htmlFor="goal-contribution-amount"
              required
              error={errors.amount?.message}
            >
              <Input
                id="goal-contribution-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="15000"
                {...register("amount", { valueAsNumber: true })}
              />
            </FormField>
            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
              This action increments the saved amount and can automatically complete the goal if the target is reached.
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Add contribution"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
