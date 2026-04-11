"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

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
import {
  calculateInvoiceTotals,
  createDefaultInvoiceNumber,
  formatInvoiceCurrency,
  getDefaultInvoiceDate,
  getDefaultInvoiceDueDate,
} from "@/features/invoices/invoice-utils";
import { invoiceInputSchema } from "@/lib/validations/finance";
import type { InvoiceFormInput, InvoiceInput, InvoiceRecord } from "@/types/finance";

type InvoiceFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  invoices: InvoiceRecord[];
  initialInvoice?: InvoiceRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InvoiceInput) => Promise<void>;
};

function getDefaultValues(
  invoices: InvoiceRecord[],
  invoice?: InvoiceRecord | null,
): InvoiceFormInput {
  if (invoice) {
    return {
      businessProfileId: invoice.businessProfileId,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerGstin: invoice.customerGstin,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      status: invoice.status,
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
      })),
    };
  }

  return {
    businessProfileId: undefined,
    invoiceNumber: createDefaultInvoiceNumber(invoices),
    customerName: "",
    customerEmail: "",
    customerGstin: "",
    issueDate: getDefaultInvoiceDate(),
    dueDate: getDefaultInvoiceDueDate(),
    currency: "INR",
    status: "draft",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
      },
    ],
  };
}

export function InvoiceFormDrawer({
  open,
  mode,
  invoices,
  initialInvoice,
  onOpenChange,
  onSubmit,
}: InvoiceFormDrawerProps) {
  const {
    register,
    reset,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInput, undefined, InvoiceInput>({
    resolver: zodResolver(invoiceInputSchema),
    defaultValues: getDefaultValues(invoices, initialInvoice),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const watchedItems = (useWatch({ control, name: "items" }) ?? []) as InvoiceInput["items"];
  const totals = calculateInvoiceTotals(watchedItems);

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(invoices, initialInvoice));
    }
  }, [initialInvoice, invoices, open, reset]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            {mode === "create" ? "New invoice" : "Edit invoice"}
          </p>
          <DrawerTitle>
            {mode === "create" ? "Compose a GST-aware invoice" : "Refine invoice details"}
          </DrawerTitle>
          <DrawerDescription>
            Invoice totals are calculated on both the client and server, and paid invoices can sync directly into the income workflow.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Invoice number" htmlFor="invoice-number" required error={errors.invoiceNumber?.message}>
                <Input id="invoice-number" placeholder="AFM-2026-021" {...register("invoiceNumber")} />
              </FormField>
              <FormField label="Status" htmlFor="invoice-status" required error={errors.status?.message}>
                <Select id="invoice-status" {...register("status")}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Customer name" htmlFor="invoice-customer-name" required error={errors.customerName?.message}>
                <Input id="invoice-customer-name" placeholder="Nova Labs" {...register("customerName")} />
              </FormField>
              <FormField label="Customer email" htmlFor="invoice-customer-email" error={errors.customerEmail?.message}>
                <Input id="invoice-customer-email" type="email" placeholder="finance@client.com" {...register("customerEmail")} />
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Customer GSTIN" htmlFor="invoice-customer-gstin" error={errors.customerGstin?.message}>
                <Input id="invoice-customer-gstin" placeholder="29ABCDE1234F1Z5" {...register("customerGstin")} />
              </FormField>
              <FormField label="Issue date" htmlFor="invoice-issue-date" required error={errors.issueDate?.message}>
                <Input id="invoice-issue-date" type="date" {...register("issueDate")} />
              </FormField>
              <FormField label="Due date" htmlFor="invoice-due-date" error={errors.dueDate?.message}>
                <Input id="invoice-due-date" type="date" {...register("dueDate")} />
              </FormField>
            </div>

            <div className="rounded-[1.5rem] border border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Line items</p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    Add services or products and the invoice totals update instantly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      gstRate: 18,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.6fr_0.6fr_0.8fr_0.7fr_auto]">
                      <FormField
                        label="Description"
                        htmlFor={`invoice-item-description-${index}`}
                        error={errors.items?.[index]?.description?.message}
                      >
                        <Input
                          id={`invoice-item-description-${index}`}
                          placeholder="Design retainer"
                          {...register(`items.${index}.description`)}
                        />
                      </FormField>
                      <FormField
                        label="Qty"
                        htmlFor={`invoice-item-quantity-${index}`}
                        error={errors.items?.[index]?.quantity?.message}
                      >
                        <Input
                          id={`invoice-item-quantity-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </FormField>
                      <FormField
                        label="Unit price"
                        htmlFor={`invoice-item-unit-price-${index}`}
                        error={errors.items?.[index]?.unitPrice?.message}
                      >
                        <Input
                          id={`invoice-item-unit-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        />
                      </FormField>
                      <FormField
                        label="GST %"
                        htmlFor={`invoice-item-gst-rate-${index}`}
                        error={errors.items?.[index]?.gstRate?.message}
                      >
                        <Input
                          id={`invoice-item-gst-rate-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...register(`items.${index}.gstRate`, { valueAsNumber: true })}
                        />
                      </FormField>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <FormField label="Currency" htmlFor="invoice-currency" error={errors.currency?.message}>
                <Input id="invoice-currency" maxLength={3} placeholder="INR" {...register("currency")} />
              </FormField>
              <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Subtotal</p>
                <p className="mt-3 font-display text-2xl font-bold text-foreground">
                  {formatInvoiceCurrency(totals.subtotal)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-border bg-surface-subtle p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Total</p>
                <p className="mt-3 font-display text-2xl font-bold text-foreground">
                  {formatInvoiceCurrency(totals.totalAmount)}
                </p>
              </div>
            </div>

            <FormField label="Notes" htmlFor="invoice-notes" error={errors.notes?.message}>
              <Textarea
                id="invoice-notes"
                placeholder="Payment terms, scope notes, or follow-up context."
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
                : mode === "create"
                  ? "Create invoice"
                  : "Save invoice"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
