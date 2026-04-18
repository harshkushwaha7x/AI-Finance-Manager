"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  formatCurrencyCodeInput,
  formatPhoneInput,
} from "@/lib/utils/input-formatters";
import { profileUpdateSchema } from "@/lib/validations/settings";
import type {
  ProfileFormInput,
  ProfileRecord,
  ProfileUpdateInput,
} from "@/types/settings";

type ProfileFormCardProps = {
  profile: ProfileRecord;
  isSaving: boolean;
  onSubmit: (values: ProfileUpdateInput) => Promise<void>;
};

export function ProfileFormCard({
  profile,
  isSaving,
  onSubmit,
}: ProfileFormCardProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput, undefined, ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
      locale: profile.locale,
      defaultCurrency: profile.defaultCurrency,
    },
  });

  useEffect(() => {
    reset({
      fullName: profile.fullName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
      locale: profile.locale,
      defaultCurrency: profile.defaultCurrency,
    });
  }, [profile, reset]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profile and account identity</CardTitle>
        <CardDescription>
          Keep the public-facing identity of this finance workspace clean: name, contact layer,
          avatar, locale, and currency defaults all live here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="profile-settings-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 sm:grid-cols-2"
        >
          <FormField
            label="Full name"
            htmlFor="profile-full-name"
            required
            error={errors.fullName?.message}
          >
            <Input id="profile-full-name" {...register("fullName")} />
          </FormField>
          <FormField label="Phone" htmlFor="profile-phone" error={errors.phone?.message}>
            <Input
              id="profile-phone"
              placeholder="+91 98765 43210"
              {...register("phone", {
                onChange: (event) => {
                  event.target.value = formatPhoneInput(event.target.value);
                },
              })}
            />
          </FormField>
          <FormField
            label="Avatar URL"
            htmlFor="profile-avatar-url"
            error={errors.avatarUrl?.message}
            hint="Optional image URL for a richer portfolio demo profile."
          >
            <Input
              id="profile-avatar-url"
              placeholder="https://images.example.com/avatar.png"
              {...register("avatarUrl")}
            />
          </FormField>
          <FormField label="Locale" htmlFor="profile-locale" error={errors.locale?.message}>
            <Input id="profile-locale" placeholder="en-IN" {...register("locale")} />
          </FormField>
          <FormField
            label="Default currency"
            htmlFor="profile-default-currency"
            error={errors.defaultCurrency?.message}
          >
            <Input
              id="profile-default-currency"
              maxLength={3}
              placeholder="INR"
              {...register("defaultCurrency", {
                onChange: (event) => {
                  event.target.value = formatCurrencyCodeInput(event.target.value);
                },
              })}
            />
          </FormField>
        </form>
      </CardContent>
      <CardFooter className="justify-between border-t border-black/6 pt-6">
        <p className="text-sm leading-7 text-muted">
          Changes here shape the identity layer across dashboards, invoices, and service handoff.
        </p>
        <Button
          type="submit"
          form="profile-settings-form"
          disabled={isSaving || isSubmitting || !isDirty}
        >
          <Save className="h-4 w-4" />
          {isSaving || isSubmitting ? "Saving..." : "Save profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}
