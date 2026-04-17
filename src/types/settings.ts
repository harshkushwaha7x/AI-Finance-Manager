import type { z } from "zod";

import {
  businessSettingsRecordSchema,
  businessSettingsUpdateSchema,
  notificationPreferencesSchema,
  profileRecordSchema,
  profileSummarySchema,
  profileUpdateSchema,
  profileWorkspaceStateSchema,
  settingsBillingStatusSchema,
  settingsChecklistItemSchema,
  settingsProfileTypeSchema,
  settingsSourceSchema,
  settingsSubscriptionPlanSchema,
  settingsSummarySchema,
  settingsWorkspaceStateSchema,
  subscriptionRecordSchema,
} from "@/lib/validations/settings";

export type SettingsSource = z.infer<typeof settingsSourceSchema>;
export type SettingsProfileType = z.infer<typeof settingsProfileTypeSchema>;
export type SettingsSubscriptionPlan = z.infer<typeof settingsSubscriptionPlanSchema>;
export type SettingsBillingStatus = z.infer<typeof settingsBillingStatusSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileFormInput = z.input<typeof profileUpdateSchema>;
export type ProfileRecord = z.infer<typeof profileRecordSchema>;
export type ProfileSummary = z.infer<typeof profileSummarySchema>;
export type SubscriptionRecord = z.infer<typeof subscriptionRecordSchema>;
export type ProfileWorkspaceState = z.infer<typeof profileWorkspaceStateSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type BusinessSettingsUpdateInput = z.infer<typeof businessSettingsUpdateSchema>;
export type BusinessSettingsFormInput = z.input<typeof businessSettingsUpdateSchema>;
export type BusinessSettingsRecord = z.infer<typeof businessSettingsRecordSchema>;
export type SettingsChecklistItem = z.infer<typeof settingsChecklistItemSchema>;
export type SettingsSummary = z.infer<typeof settingsSummarySchema>;
export type SettingsWorkspaceState = z.infer<typeof settingsWorkspaceStateSchema>;
