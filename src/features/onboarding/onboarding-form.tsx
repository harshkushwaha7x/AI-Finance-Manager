"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OnboardingPreview } from "@/features/onboarding/onboarding-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fiscalYearMonths,
  onboardingDefaultValues,
  onboardingFocusAreas,
  onboardingProfileCards,
} from "@/lib/onboarding/constants";
import {
  onboardingInputSchema,
  type OnboardingFormValues,
  type OnboardingInput,
} from "@/lib/validations/onboarding";
import { cn } from "@/lib/utils";

type OnboardingFormProps = {
  initialValues: OnboardingFormValues;
};

export function OnboardingForm({ initialValues }: OnboardingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues, undefined, OnboardingInput>({
    resolver: zodResolver(onboardingInputSchema),
    defaultValues: initialValues,
  });

  const profileType = watch("profileType");
  const fullName = watch("fullName");
  const workspaceName = watch("workspaceName");
  const currency = watch("currency");
  const fiscalYearStartMonth = watch("fiscalYearStartMonth");
  const focusAreas = watch("focusAreas");
  const previewProfileType = profileType ?? initialValues.profileType ?? onboardingDefaultValues.profileType;
  const previewFullName = fullName ?? initialValues.fullName ?? "";
  const previewWorkspaceName = workspaceName ?? initialValues.workspaceName ?? "";
  const previewCurrency = currency ?? initialValues.currency ?? onboardingDefaultValues.currency;
  const previewFiscalYearStartMonth =
    typeof fiscalYearStartMonth === "number"
      ? fiscalYearStartMonth
      : typeof initialValues.fiscalYearStartMonth === "number"
        ? initialValues.fiscalYearStartMonth
        : onboardingDefaultValues.fiscalYearStartMonth;
  const previewFocusAreas = focusAreas ?? initialValues.focusAreas ?? [...onboardingDefaultValues.focusAreas];

  async function onSubmit(values: OnboardingInput) {
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to save onboarding right now.");
      }

      toast.success("Workspace configured. Redirecting to your dashboard.");
      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    }
  }

  function toggleFocusArea(value: OnboardingInput["focusAreas"][number]) {
    const currentFocusAreas = focusAreas ?? [];
    const nextValues = currentFocusAreas.includes(value)
      ? currentFocusAreas.filter((item) => item !== value)
      : [...currentFocusAreas, value];

    setValue("focusAreas", nextValues, { shouldValidate: true, shouldDirty: true });
  }

  const isBusinessLikeProfile =
    previewProfileType === "freelancer" || previewProfileType === "business";

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Step 1</p>
            <CardTitle>Choose the finance operating mode you want to launch with</CardTitle>
            <p className="text-sm leading-7 text-muted">
              This controls the default dashboard story, sample data, and the finance workflows we
              emphasize first.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {onboardingProfileCards.map((profile) => {
              const isSelected = previewProfileType === profile.value;

              return (
                <button
                  key={profile.value}
                  type="button"
                  onClick={() =>
                    setValue("profileType", profile.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    "rounded-[1.5rem] border p-5 text-left transition",
                    isSelected
                      ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                      : "border-black/6 bg-surface-subtle hover:border-primary/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-bold text-foreground">{profile.title}</p>
                      <p className="mt-3 text-sm leading-7 text-muted">{profile.description}</p>
                    </div>
                    {isSelected ? (
                      <div className="rounded-full bg-primary p-2 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Step 2</p>
            <CardTitle>Set the identity and finance preferences for this workspace</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
              <Input id="fullName" placeholder="Harsh Kushwaha" {...register("fullName")} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="harsh@example.com" {...register("email")} />
            </FormField>
            <FormField
              label="Workspace name"
              htmlFor="workspaceName"
              required
              error={errors.workspaceName?.message}
              hint="This becomes the top-level name for your finance workspace."
            >
              <Input id="workspaceName" placeholder="Studio Ledger" {...register("workspaceName")} />
            </FormField>
            <FormField label="Currency" htmlFor="currency" required error={errors.currency?.message}>
              <Input id="currency" maxLength={3} placeholder="INR" {...register("currency")} />
            </FormField>
            <FormField
              label="Fiscal year starts"
              htmlFor="fiscalYearStartMonth"
              required
              error={errors.fiscalYearStartMonth?.message}
            >
              <Select id="fiscalYearStartMonth" {...register("fiscalYearStartMonth", { valueAsNumber: true })}>
                {fiscalYearMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Monthly income target"
              htmlFor="monthlyIncomeTarget"
              error={errors.monthlyIncomeTarget?.message}
            >
              <Input
                id="monthlyIncomeTarget"
                type="number"
                min="0"
                placeholder="120000"
                {...register("monthlyIncomeTarget", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              label="Monthly budget target"
              htmlFor="monthlyBudgetTarget"
              error={errors.monthlyBudgetTarget?.message}
            >
              <Input
                id="monthlyBudgetTarget"
                type="number"
                min="0"
                placeholder="60000"
                {...register("monthlyBudgetTarget", { valueAsNumber: true })}
              />
            </FormField>
            {isBusinessLikeProfile ? (
              <>
                <FormField label="Legal name" htmlFor="legalName" error={errors.legalName?.message}>
                  <Input id="legalName" placeholder="Harsh Studio LLP" {...register("legalName")} />
                </FormField>
                <FormField label="GSTIN" htmlFor="gstin" error={errors.gstin?.message}>
                  <Input id="gstin" placeholder="22AAAAA0000A1Z5" {...register("gstin")} />
                </FormField>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Step 3</p>
            <CardTitle>Choose what the dashboard should prioritize first</CardTitle>
            <p className="text-sm leading-7 text-muted">
              These focus areas tailor the sample dashboard story and make the repo feel more product-aware.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {onboardingFocusAreas.map((focusArea) => {
                const isSelected = previewFocusAreas.includes(focusArea.value);

                return (
                  <button
                    key={focusArea.value}
                    type="button"
                    onClick={() => toggleFocusArea(focusArea.value)}
                    className={cn(
                      "rounded-[1.4rem] border p-4 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                        : "border-black/6 bg-surface-subtle hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">{focusArea.label}</p>
                        <p className="mt-2 text-sm leading-7 text-muted">{focusArea.description}</p>
                      </div>
                      {isSelected ? (
                        <div className="rounded-full bg-primary p-2 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.focusAreas?.message ? <p className="text-sm text-danger">{errors.focusAreas.message}</p> : null}
            <FormField
              label="Optional onboarding note"
              htmlFor="onboarding-note"
              hint="You can keep this blank. It simply demonstrates a richer onboarding field pattern."
            >
              <Textarea
                id="onboarding-note"
                className="min-h-28"
                placeholder="Example: I want better invoice visibility and monthly tax prep reminders."
              />
            </FormField>
          </CardContent>
          <CardFooter className="flex-col items-start justify-between gap-4 border-t border-black/6 pt-6 sm:flex-row sm:items-center">
            <p className="text-sm leading-7 text-muted">
              Demo mode stores this setup in a portfolio-friendly onboarding snapshot today and upgrades to
              database persistence automatically when your backend is connected.
            </p>
            <Button type="submit" size="lg" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending ? "Finishing setup..." : "Finish setup"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </form>
      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <OnboardingPreview
          profileType={previewProfileType}
          workspaceName={previewWorkspaceName}
          fullName={previewFullName}
          currency={previewCurrency}
          fiscalYearStartMonth={previewFiscalYearStartMonth}
          focusAreas={previewFocusAreas}
        />
      </div>
    </div>
  );
}
