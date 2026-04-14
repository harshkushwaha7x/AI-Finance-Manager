"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDocumentKindLabel,
  formatDocumentStatusLabel,
  getDocumentStatusVariant,
} from "@/features/documents/document-utils";
import {
  buildPackageHighlights,
  formatUrgency,
  sortDocumentsForSelection,
} from "@/features/accountant/accountant-utils";
import { cn } from "@/lib/utils";
import { accountantRequestInputSchema } from "@/lib/validations/finance";
import type { AccountantRequestStep } from "@/types/accountant";
import type {
  AccountantDocumentOption,
  AccountantPackageRecord,
  AccountantRequestInput,
} from "@/types/finance";

const accountantRequestFormSchema = accountantRequestInputSchema.extend({
  preferredDate: z.string().optional().or(z.literal("")),
});

type AccountantRequestFormValues = z.infer<typeof accountantRequestFormSchema>;
type AccountantRequestFormInput = z.input<typeof accountantRequestFormSchema>;

type AccountantRequestFormProps = {
  packages: AccountantPackageRecord[];
  documentOptions: AccountantDocumentOption[];
  selectedPackageId?: string;
  initialWorkspaceName?: string;
  initialGstin?: string;
  onSelectPackage: (packageId: string) => void;
  onSubmit: (values: AccountantRequestInput) => Promise<void>;
};

const stepOrder: { id: AccountantRequestStep; label: string }[] = [
  { id: "package", label: "Package" },
  { id: "details", label: "Details" },
  { id: "documents", label: "Documents" },
];

function getDefaultValues(
  selectedPackageId: string | undefined,
  initialWorkspaceName: string | undefined,
  initialGstin: string | undefined,
): AccountantRequestFormInput {
  return {
    businessProfileId: undefined,
    packageId: selectedPackageId,
    requestType: "consultation",
    message: "",
    urgency: "normal",
    preferredDate: "",
    context: {
      workspaceName: initialWorkspaceName ?? "",
      gstin: initialGstin ?? "",
      documentIds: [],
      documentNames: [],
    },
  };
}

export function AccountantRequestForm({
  packages,
  documentOptions,
  selectedPackageId,
  initialWorkspaceName,
  initialGstin,
  onSelectPackage,
  onSubmit,
}: AccountantRequestFormProps) {
  const [step, setStep] = useState<AccountantRequestStep>("package");
  const sortedDocuments = useMemo(
    () => sortDocumentsForSelection(documentOptions),
    [documentOptions],
  );
  const selectedPackage =
    packages.find((packageRecord) => packageRecord.id === selectedPackageId) ?? null;
  const {
    control,
    register,
    reset,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountantRequestFormInput, undefined, AccountantRequestFormValues>({
    resolver: zodResolver(accountantRequestFormSchema),
    defaultValues: getDefaultValues(selectedPackageId, initialWorkspaceName, initialGstin),
  });

  const selectedDocumentIds =
    useWatch({
      control,
      name: "context.documentIds",
    }) ?? [];
  const selectedDocumentCount = selectedDocumentIds.length;
  const watchedRequestType =
    useWatch({
      control,
      name: "requestType",
    }) ?? "consultation";
  const watchedMessage =
    useWatch({
      control,
      name: "message",
    }) ?? "";
  const watchedUrgency =
    useWatch({
      control,
      name: "urgency",
    }) ?? "normal";

  useEffect(() => {
    setValue("packageId", selectedPackageId);
  }, [selectedPackageId, setValue]);

  function goToStep(nextStep: AccountantRequestStep) {
    if (nextStep === "package") {
      setStep("package");
      return;
    }

    if (!selectedPackageId) {
      return;
    }

    if (nextStep === "details") {
      setStep("details");
      return;
    }

    void (async () => {
      const isValid = await trigger([
        "requestType",
        "message",
        "urgency",
        "context.workspaceName",
        "context.gstin",
      ]);

      if (isValid) {
        setStep("documents");
      }
    })();
  }

  async function handleValidSubmit(values: AccountantRequestFormValues) {
    const selectedDocuments = sortedDocuments.filter((document) =>
      selectedDocumentIds.includes(document.id),
    );

    try {
      await onSubmit({
        ...values,
        packageId: selectedPackageId,
        preferredDate: values.preferredDate
          ? new Date(values.preferredDate).toISOString()
          : undefined,
        context: {
          workspaceName: values.context.workspaceName,
          gstin: values.context.gstin,
          documentIds: selectedDocuments.map((document) => document.id),
          documentNames: selectedDocuments.map((document) => document.originalName),
        },
      });

      reset(
        getDefaultValues(selectedPackageId, values.context.workspaceName, values.context.gstin),
      );
      setStep("package");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit the accountant request.",
      );
    }
  }

  return (
    <Card className="rounded-[1.7rem]">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.24em] text-primary">Request intake</p>
        <CardTitle className="mt-3">Route users into a real accountant service workflow</CardTitle>
        <CardDescription className="mt-2">
          Pick a package, add the finance context that matters, and attach documents so the request
          reaches admin in a service-ready shape.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {stepOrder.map((item) => {
            const isActive = item.id === step;
            const isBlocked = item.id !== "package" && !selectedPackageId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToStep(item.id)}
                disabled={isBlocked}
                className={cn(
                  "rounded-[1.3rem] border px-4 py-3 text-left transition",
                  isActive
                    ? "border-primary/30 bg-primary/6 shadow-sm"
                    : "border-border bg-surface-subtle hover:border-primary/20",
                  isBlocked && "cursor-not-allowed opacity-50",
                )}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {item.id === "package"
                    ? "Choose a service lane"
                    : item.id === "details"
                      ? "Capture the case"
                      : "Attach supporting docs"}
                </p>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(handleValidSubmit)} className="space-y-6">
          {step === "package" ? (
            <div className="space-y-4">
              {selectedPackage ? (
                <div className="rounded-[1.5rem] border border-primary/20 bg-primary/6 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedPackage.name}</p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {selectedPackage.description}
                      </p>
                    </div>
                    <Badge variant="success">Ready to request</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {buildPackageHighlights(selectedPackage).map((highlight) => (
                      <Badge key={highlight} variant="secondary">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-foreground">Choose a package first</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    The request form unlocks after you pick a service package from the grid.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {packages.map((packageRecord) => (
                  <button
                    key={packageRecord.id}
                    type="button"
                    onClick={() => onSelectPackage(packageRecord.id)}
                    className={cn(
                      "rounded-[1.4rem] border p-4 text-left transition",
                      packageRecord.id === selectedPackageId
                        ? "border-primary/30 bg-primary/6 shadow-sm"
                        : "border-border bg-surface-subtle hover:border-primary/20",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{packageRecord.name}</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{packageRecord.priceLabel}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => goToStep("details")}
                  disabled={!selectedPackageId}
                >
                  Continue to details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Request type"
                  htmlFor="accountant-request-type"
                  error={errors.requestType?.message}
                >
                  <Select id="accountant-request-type" {...register("requestType")}>
                    <option value="consultation">Consultation</option>
                    <option value="gst">GST review</option>
                    <option value="bookkeeping">Bookkeeping</option>
                    <option value="filing">Filing support</option>
                    <option value="custom">Custom case</option>
                  </Select>
                </FormField>

                <FormField
                  label="Urgency"
                  htmlFor="accountant-urgency"
                  error={errors.urgency?.message}
                >
                  <Select id="accountant-urgency" {...register("urgency")}>
                    <option value="low">Low urgency</option>
                    <option value="normal">Normal urgency</option>
                    <option value="high">High urgency</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Workspace name"
                  htmlFor="accountant-workspace-name"
                  hint="This gives the admin side a recognizable client or business label."
                  error={errors.context?.workspaceName?.message}
                >
                  <Input
                    id="accountant-workspace-name"
                    placeholder="Northwind Studio or Personal workspace"
                    {...register("context.workspaceName")}
                  />
                </FormField>

                <FormField
                  label="GSTIN"
                  htmlFor="accountant-gstin"
                  hint="Optional for personal use, helpful for business and freelancer requests."
                  error={errors.context?.gstin?.message}
                >
                  <Input
                    id="accountant-gstin"
                    placeholder="22AAAAA0000A1Z5"
                    {...register("context.gstin")}
                  />
                </FormField>
              </div>

              <FormField
                label="Preferred discussion slot"
                htmlFor="accountant-preferred-date"
                hint="Optional. Use local date and time to suggest your preferred consultation window."
                error={errors.preferredDate?.message}
              >
                <Input
                  id="accountant-preferred-date"
                  type="datetime-local"
                  {...register("preferredDate")}
                />
              </FormField>

              <FormField
                label="What do you need help with?"
                htmlFor="accountant-message"
                required
                hint="Share enough detail that an admin or accountant can qualify the request quickly."
                error={errors.message?.message}
              >
                <Textarea
                  id="accountant-message"
                  className="min-h-32"
                  placeholder="Example: I need help fixing GST handling, setting up invoice hygiene, and reviewing what documents I should keep ready each month."
                  {...register("message")}
                />
              </FormField>

              <div className="flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("package")}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to package
                </Button>
                <Button type="button" onClick={() => goToStep("documents")}>
                  Continue to documents
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === "documents" ? (
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-border bg-surface-subtle p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedPackage?.name ?? "Selected package"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {watchedMessage ||
                        "Add request details in the previous step to summarize the case here."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {watchedRequestType === "gst"
                        ? "GST review"
                        : watchedRequestType === "bookkeeping"
                          ? "Bookkeeping"
                          : watchedRequestType === "filing"
                            ? "Filing support"
                            : watchedRequestType === "custom"
                              ? "Custom case"
                              : "Consultation"}
                    </Badge>
                    <Badge variant="warning">{formatUrgency(watchedUrgency)}</Badge>
                  </div>
                </div>
              </div>

              {sortedDocuments.length ? (
                <div className="space-y-3">
                  {sortedDocuments.map((document) => {
                    const isSelected = selectedDocumentIds.includes(document.id);

                    return (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => {
                          const nextDocumentIds = isSelected
                            ? selectedDocumentIds.filter((id) => id !== document.id)
                            : [...selectedDocumentIds, document.id];

                          setValue("context.documentIds", nextDocumentIds, {
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                        className={cn(
                          "w-full rounded-[1.4rem] border p-4 text-left transition",
                          isSelected
                            ? "border-primary/30 bg-primary/6 shadow-sm"
                            : "border-border bg-surface hover:border-primary/20 hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{document.originalName}</p>
                            <p className="mt-2 text-sm leading-7 text-muted">
                              {document.aiSummary || "No AI summary yet. Attach this file if it supports the request."}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{formatDocumentKindLabel(document.kind)}</Badge>
                            <Badge variant={getDocumentStatusVariant(document.status)}>
                              {formatDocumentStatusLabel(document.status)}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-border px-5 py-8 text-center">
                  <FileText className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm font-semibold text-foreground">No uploaded documents yet</p>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    You can still submit the request now, then upload supporting files later from the documents workspace.
                  </p>
                </div>
              )}

              <div className="rounded-[1.4rem] border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-2 text-primary shadow-sm">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedDocumentCount
                        ? `${selectedDocumentCount} document${selectedDocumentCount === 1 ? "" : "s"} attached`
                        : "No documents attached yet"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Attached documents travel with the request so the accountant or admin side has context immediately during qualification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-black/6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="secondary" onClick={() => setStep("details")}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to details
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting request..." : "Submit accountant request"}
                  {!isSubmitting ? <CheckCircle2 className="h-4 w-4" /> : null}
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
