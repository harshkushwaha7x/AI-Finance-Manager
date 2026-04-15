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
import { Textarea } from "@/components/ui/textarea";
import { adminPackageInputSchema } from "@/lib/validations/admin";
import type { AdminPackageFormInput, AdminPackageInput } from "@/types/admin";
import type { AccountantPackageRecord } from "@/types/finance";

type AdminPackageFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  initialPackage?: AccountantPackageRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminPackageInput) => Promise<void>;
};

function getDefaultValues(packageRecord?: AccountantPackageRecord | null): AdminPackageFormInput {
  return {
    name: packageRecord?.name ?? "",
    slug: packageRecord?.slug ?? "",
    description: packageRecord?.description ?? "",
    audience: packageRecord?.audience ?? "",
    priceLabel: packageRecord?.priceLabel ?? "",
    turnaroundText: packageRecord?.turnaroundText ?? "",
    isActive: packageRecord?.isActive ?? true,
  };
}

export function AdminPackageFormDrawer({
  open,
  mode,
  initialPackage,
  onOpenChange,
  onSubmit,
}: AdminPackageFormDrawerProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminPackageFormInput, undefined, AdminPackageInput>({
    resolver: zodResolver(adminPackageInputSchema),
    defaultValues: getDefaultValues(initialPackage),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(initialPackage));
    }
  }, [initialPackage, open, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            {mode === "create" ? "New package" : "Edit package"}
          </p>
          <DrawerTitle>
            {mode === "create"
              ? "Create a service offer the product can actually sell"
              : "Refine this service package"}
          </DrawerTitle>
          <DrawerDescription>
            Package copy, price labels, and active states all feed the user-facing accountant workspace.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5">
            <FormField
              label="Package name"
              htmlFor="admin-package-name"
              required
              error={errors.name?.message}
            >
              <Input
                id="admin-package-name"
                placeholder="Monthly Bookkeeping and GST Support"
                {...register("name")}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Slug"
                htmlFor="admin-package-slug"
                required
                error={errors.slug?.message}
              >
                <Input
                  id="admin-package-slug"
                  placeholder="monthly-bookkeeping-and-gst-support"
                  {...register("slug")}
                />
              </FormField>
              <FormField
                label="Audience"
                htmlFor="admin-package-audience"
                required
                error={errors.audience?.message}
              >
                <Input
                  id="admin-package-audience"
                  placeholder="SMBs, freelancers, and operators"
                  {...register("audience")}
                />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Price label"
                htmlFor="admin-package-price"
                required
                error={errors.priceLabel?.message}
              >
                <Input id="admin-package-price" placeholder="Starts at INR 7,500/mo" {...register("priceLabel")} />
              </FormField>
              <FormField
                label="Turnaround"
                htmlFor="admin-package-turnaround"
                required
                error={errors.turnaroundText?.message}
              >
                <Input
                  id="admin-package-turnaround"
                  placeholder="2-3 business days"
                  {...register("turnaroundText")}
                />
              </FormField>
            </div>
            <FormField
              label="Description"
              htmlFor="admin-package-description"
              required
              error={errors.description?.message}
            >
              <Textarea
                id="admin-package-description"
                className="min-h-32"
                placeholder="Explain what the package covers, what makes it compelling, and why someone would choose it."
                {...register("description")}
              />
            </FormField>
            <div className="rounded-[1.4rem] border border-black/6 bg-surface-subtle p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-border accent-[var(--color-primary)]"
                  {...register("isActive")}
                />
                Package is visible in the user-facing service flow
              </label>
              <p className="mt-2 text-sm leading-7 text-muted">
                Turn this off when you want to keep a package in ops history without offering it publicly.
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
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create package"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
