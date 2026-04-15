import type { z } from "zod";

import {
  adminLeadWorkspaceStateSchema,
  adminOverviewMetricsSchema,
  adminOverviewStateSchema,
  adminPackageInputSchema,
  adminPackageWorkspaceStateSchema,
  adminRequestUpdateSchema,
  adminUserWorkspaceStateSchema,
  contactLeadRecordSchema,
  supportUserRecordSchema,
} from "@/lib/validations/admin";

export type ContactLeadRecord = z.infer<typeof contactLeadRecordSchema>;
export type AdminPackageInput = z.infer<typeof adminPackageInputSchema>;
export type AdminPackageFormInput = z.input<typeof adminPackageInputSchema>;
export type AdminRequestUpdateInput = z.infer<typeof adminRequestUpdateSchema>;
export type AdminOverviewMetrics = z.infer<typeof adminOverviewMetricsSchema>;
export type SupportUserRecord = z.infer<typeof supportUserRecordSchema>;
export type AdminOverviewState = z.infer<typeof adminOverviewStateSchema>;
export type AdminLeadWorkspaceState = z.infer<typeof adminLeadWorkspaceStateSchema>;
export type AdminPackageWorkspaceState = z.infer<typeof adminPackageWorkspaceStateSchema>;
export type AdminUserWorkspaceState = z.infer<typeof adminUserWorkspaceStateSchema>;
