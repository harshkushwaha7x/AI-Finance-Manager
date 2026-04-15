import { z } from "zod";

import { contactLeadSchema } from "@/lib/validations/contact";
import {
  accountantPackageRecordSchema,
  accountantRequestRecordSchema,
} from "@/lib/validations/finance";

const dateTimeStringSchema = z.string().min(1);
const optionalLongTextSchema = z.string().max(500).optional().or(z.literal(""));

export const contactLeadRecordSchema = contactLeadSchema.extend({
  id: z.string().uuid(),
  source: z.string().min(1),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const adminPackageInputSchema = z.object({
  name: z.string().min(2, "Package name is required."),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().min(10, "Add a more descriptive package summary."),
  audience: z.string().min(2, "Audience is required."),
  priceLabel: z.string().min(2, "Price label is required."),
  turnaroundText: z.string().min(2, "Turnaround text is required."),
  isActive: z.boolean().default(true),
});

export const adminRequestUpdateSchema = z.object({
  status: accountantRequestRecordSchema.shape.status,
  adminNotes: optionalLongTextSchema,
});

export const adminOverviewMetricsSchema = z.object({
  newLeads: z.coerce.number().int().min(0),
  qualifiedRequests: z.coerce.number().int().min(0),
  activePackages: z.coerce.number().int().min(0),
  openFollowUps: z.coerce.number().int().min(0),
  scheduledConsultations: z.coerce.number().int().min(0),
});

export const supportUserRecordSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  email: z.string().min(1),
  workspaceName: z.string().min(1),
  profileType: z.enum(["personal", "freelancer", "business"]),
  onboardingCompleted: z.boolean(),
  planLabel: z.string().min(1),
  requestCount: z.coerce.number().int().min(0),
  documentCount: z.coerce.number().int().min(0),
  latestActivity: z.string().min(1),
});

export const adminOverviewStateSchema = z.object({
  metrics: adminOverviewMetricsSchema,
  requests: z.array(accountantRequestRecordSchema),
  packages: z.array(accountantPackageRecordSchema),
  leads: z.array(contactLeadRecordSchema),
  source: z.enum(["demo", "database"]),
});

export const adminLeadWorkspaceStateSchema = z.object({
  leads: z.array(contactLeadRecordSchema),
  requests: z.array(accountantRequestRecordSchema),
  source: z.enum(["demo", "database"]),
});

export const adminPackageWorkspaceStateSchema = z.object({
  packages: z.array(accountantPackageRecordSchema),
  source: z.enum(["demo", "database"]),
});

export const adminUserWorkspaceStateSchema = z.object({
  users: z.array(supportUserRecordSchema),
  source: z.enum(["demo", "database"]),
});
