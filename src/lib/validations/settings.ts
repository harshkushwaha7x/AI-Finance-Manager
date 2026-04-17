import { z } from "zod";

const currencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter currency code.")
  .transform((value) => value.toUpperCase());

const optionalText = z.string().trim().max(240).optional().or(z.literal(""));
const optionalLongText = z.string().trim().max(1200).optional().or(z.literal(""));

export const settingsSourceSchema = z.enum(["demo", "database"]);
export const settingsProfileTypeSchema = z.enum(["personal", "freelancer", "business"]);
export const settingsSubscriptionPlanSchema = z.enum(["free", "pro", "business"]);
export const settingsBillingStatusSchema = z.enum([
  "trial",
  "active",
  "past_due",
  "cancelled",
  "manual",
]);

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  phone: z.string().trim().max(30, "Phone number is too long.").optional().or(z.literal("")),
  avatarUrl: z.url("Enter a valid image URL.").optional().or(z.literal("")),
  locale: z.string().trim().min(2, "Locale is required.").max(16),
  defaultCurrency: currencyCodeSchema,
});

export const subscriptionRecordSchema = z.object({
  plan: settingsSubscriptionPlanSchema,
  billingStatus: settingsBillingStatusSchema,
  provider: z.string().trim().min(1),
  renewalDate: z.string().optional().or(z.literal("")),
});

export const profileRecordSchema = profileUpdateSchema.extend({
  email: z.email("Enter a valid email address."),
  workspaceName: z.string().trim().min(2),
  profileType: settingsProfileTypeSchema,
  onboardingCompleted: z.boolean(),
  joinedAt: z.string(),
});

export const profileSummarySchema = z.object({
  completionPercent: z.number().min(0).max(100),
  contactFieldsCompleted: z.number().int().min(0),
  preferencesConfigured: z.number().int().min(0),
  workspaceModeLabel: z.string().trim().min(1),
});

export const profileWorkspaceStateSchema = z.object({
  profile: profileRecordSchema,
  subscription: subscriptionRecordSchema,
  summary: profileSummarySchema,
  source: settingsSourceSchema,
});

export const notificationPreferencesSchema = z.object({
  budgetAlerts: z.boolean(),
  goalUpdates: z.boolean(),
  reportReady: z.boolean(),
  serviceUpdates: z.boolean(),
});

export const businessSettingsUpdateSchema = z.object({
  legalName: optionalText,
  tradeName: optionalText,
  gstin: z.string().trim().max(30).optional().or(z.literal("")),
  pan: z.string().trim().max(20).optional().or(z.literal("")),
  businessEmail: z.email("Enter a valid business email address.").optional().or(z.literal("")),
  businessPhone: z.string().trim().max(30).optional().or(z.literal("")),
  addressLine1: optionalText,
  addressLine2: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(2, "Country is required.").max(80),
  invoicePrefix: z.string().trim().max(20).optional().or(z.literal("")),
  defaultInvoiceNotes: optionalLongText,
  defaultPaymentTermsDays: z.coerce
    .number()
    .int("Use a whole number of days.")
    .min(0, "Payment terms cannot be negative.")
    .max(180, "Payment terms are too long.")
    .default(14),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).default(4),
});

export const businessSettingsRecordSchema = businessSettingsUpdateSchema.extend({
  profileType: settingsProfileTypeSchema,
});

export const settingsChecklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  complete: z.boolean(),
});

export const settingsSummarySchema = z.object({
  completionPercent: z.number().min(0).max(100),
  enabledPreferenceCount: z.number().int().min(0),
  taxProfileReady: z.boolean(),
  invoiceDefaultsReady: z.boolean(),
});

export const settingsWorkspaceStateSchema = z.object({
  businessProfile: businessSettingsRecordSchema,
  notificationPreferences: notificationPreferencesSchema,
  subscription: subscriptionRecordSchema,
  checklist: z.array(settingsChecklistItemSchema),
  summary: settingsSummarySchema,
  source: settingsSourceSchema,
});
