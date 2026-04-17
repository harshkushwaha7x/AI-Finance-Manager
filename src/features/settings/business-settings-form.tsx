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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fiscalYearMonths } from "@/lib/onboarding/constants";
import { businessSettingsUpdateSchema } from "@/lib/validations/settings";
import type {
  BusinessSettingsFormInput,
  BusinessSettingsRecord,
  BusinessSettingsUpdateInput,
} from "@/types/settings";

type BusinessSettingsFormProps = {
  businessProfile: BusinessSettingsRecord;
  isSaving: boolean;
  onSubmit: (values: BusinessSettingsUpdateInput) => Promise<void>;
};

export function BusinessSettingsForm({
  businessProfile,
  isSaving,
  onSubmit,
}: BusinessSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessSettingsFormInput, undefined, BusinessSettingsUpdateInput>({
    resolver: zodResolver(businessSettingsUpdateSchema),
    defaultValues: businessProfile,
  });

  useEffect(() => {
    reset(businessProfile);
  }, [businessProfile, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business, GST, and invoice defaults</CardTitle>
        <CardDescription>
          Store the operational details your invoicing, tax center, and accountant workflows rely
          on every day.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="business-settings-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5 sm:grid-cols-2"
        >
          <FormField label="Legal name" htmlFor="settings-legal-name" error={errors.legalName?.message}>
            <Input id="settings-legal-name" {...register("legalName")} />
          </FormField>
          <FormField label="Trade name" htmlFor="settings-trade-name" error={errors.tradeName?.message}>
            <Input id="settings-trade-name" {...register("tradeName")} />
          </FormField>
          <FormField label="GSTIN" htmlFor="settings-gstin" error={errors.gstin?.message}>
            <Input id="settings-gstin" placeholder="22AAAAA0000A1Z5" {...register("gstin")} />
          </FormField>
          <FormField label="PAN" htmlFor="settings-pan" error={errors.pan?.message}>
            <Input id="settings-pan" placeholder="ABCDE1234F" {...register("pan")} />
          </FormField>
          <FormField
            label="Business email"
            htmlFor="settings-business-email"
            error={errors.businessEmail?.message}
          >
            <Input
              id="settings-business-email"
              type="email"
              placeholder="finance@studio.com"
              {...register("businessEmail")}
            />
          </FormField>
          <FormField
            label="Business phone"
            htmlFor="settings-business-phone"
            error={errors.businessPhone?.message}
          >
            <Input id="settings-business-phone" {...register("businessPhone")} />
          </FormField>
          <FormField
            label="Address line 1"
            htmlFor="settings-address-line-1"
            error={errors.addressLine1?.message}
            className="sm:col-span-2"
          >
            <Input id="settings-address-line-1" {...register("addressLine1")} />
          </FormField>
          <FormField
            label="Address line 2"
            htmlFor="settings-address-line-2"
            error={errors.addressLine2?.message}
            className="sm:col-span-2"
          >
            <Input id="settings-address-line-2" {...register("addressLine2")} />
          </FormField>
          <FormField label="City" htmlFor="settings-city" error={errors.city?.message}>
            <Input id="settings-city" {...register("city")} />
          </FormField>
          <FormField label="State" htmlFor="settings-state" error={errors.state?.message}>
            <Input id="settings-state" {...register("state")} />
          </FormField>
          <FormField
            label="Postal code"
            htmlFor="settings-postal-code"
            error={errors.postalCode?.message}
          >
            <Input id="settings-postal-code" {...register("postalCode")} />
          </FormField>
          <FormField label="Country" htmlFor="settings-country" error={errors.country?.message}>
            <Input id="settings-country" {...register("country")} />
          </FormField>
          <FormField
            label="Invoice prefix"
            htmlFor="settings-invoice-prefix"
            error={errors.invoicePrefix?.message}
          >
            <Input id="settings-invoice-prefix" {...register("invoicePrefix")} />
          </FormField>
          <FormField
            label="Default payment terms"
            htmlFor="settings-payment-terms"
            error={errors.defaultPaymentTermsDays?.message}
          >
            <Input
              id="settings-payment-terms"
              type="number"
              min="0"
              max="180"
              {...register("defaultPaymentTermsDays", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Fiscal year starts"
            htmlFor="settings-fiscal-year"
            error={errors.fiscalYearStartMonth?.message}
          >
            <Select
              id="settings-fiscal-year"
              {...register("fiscalYearStartMonth", { valueAsNumber: true })}
            >
              {fiscalYearMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Default invoice notes"
            htmlFor="settings-invoice-notes"
            error={errors.defaultInvoiceNotes?.message}
            className="sm:col-span-2"
          >
            <Textarea id="settings-invoice-notes" {...register("defaultInvoiceNotes")} />
          </FormField>
        </form>
      </CardContent>
      <CardFooter className="justify-between border-t border-black/6 pt-6">
        <p className="text-sm leading-7 text-muted">
          These settings power invoice composition, tax-center readiness, and accountant handoff.
        </p>
        <Button
          type="submit"
          form="business-settings-form"
          disabled={isSaving || isSubmitting || !isDirty}
        >
          <Save className="h-4 w-4" />
          {isSaving || isSubmitting ? "Saving..." : "Save business settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}
