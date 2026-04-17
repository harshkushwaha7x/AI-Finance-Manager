import { StatCard } from "@/components/shared/stat-card";
import type { SettingsSummary, SubscriptionRecord } from "@/types/settings";
import {
  formatSettingsBillingStatus,
  formatSettingsPlan,
} from "@/features/settings/settings-utils";

type SettingsSummaryStripProps = {
  summary: SettingsSummary;
  subscription: SubscriptionRecord;
};

export function SettingsSummaryStrip({
  summary,
  subscription,
}: SettingsSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Setup completion"
        value={`${summary.completionPercent}%`}
        detail="How complete the business and invoicing configuration looks."
      />
      <StatCard
        label="Live preferences"
        value={String(summary.enabledPreferenceCount)}
        detail="Notification switches currently enabled for the workspace."
      />
      <StatCard
        label="Tax profile"
        value={summary.taxProfileReady ? "Ready" : "Needs work"}
        detail="Signals whether business tax identity details are filled in."
      />
      <StatCard
        label="Plan status"
        value={formatSettingsPlan(subscription.plan)}
        detail={`${formatSettingsBillingStatus(subscription.billingStatus)} billing via ${subscription.provider}.`}
      />
    </section>
  );
}
