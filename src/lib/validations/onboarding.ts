import { z } from "zod";

const currencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter currency code.")
  .transform((value) => value.toUpperCase());

export const onboardingProfileTypeSchema = z.enum(["personal", "freelancer", "business"]);

export const onboardingFocusAreaSchema = z.enum([
  "budgeting",
  "savings",
  "invoicing",
  "taxes",
  "bookkeeping",
  "ai-insights",
]);

export const onboardingInputSchema = z.object({
  profileType: onboardingProfileTypeSchema,
  fullName: z.string().min(2, "Full name is required."),
  email: z.email("Enter a valid email address.").optional().or(z.literal("")),
  workspaceName: z.string().min(2, "Workspace name is required."),
  legalName: z.string().max(120).optional().or(z.literal("")),
  gstin: z.string().max(30).optional().or(z.literal("")),
  currency: currencyCodeSchema.default("INR"),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).default(4),
  monthlyIncomeTarget: z.coerce.number().min(0).default(0),
  monthlyBudgetTarget: z.coerce.number().min(0).default(0),
  focusAreas: z.array(onboardingFocusAreaSchema).min(1, "Choose at least one focus area."),
});

export const onboardingCookiePayloadSchema = onboardingInputSchema.pick({
  profileType: true,
  fullName: true,
  workspaceName: true,
  currency: true,
  fiscalYearStartMonth: true,
  monthlyIncomeTarget: true,
  monthlyBudgetTarget: true,
  focusAreas: true,
});

export type OnboardingFormValues = z.input<typeof onboardingInputSchema>;
export type OnboardingInput = z.output<typeof onboardingInputSchema>;
export type OnboardingCookiePayload = z.output<typeof onboardingCookiePayloadSchema>;
