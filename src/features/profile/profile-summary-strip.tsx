import { StatCard } from "@/components/shared/stat-card";
import type { ProfileSummary, SubscriptionRecord } from "@/types/settings";
import { formatBillingStatus, formatSubscriptionPlan } from "@/features/profile/profile-utils";

type ProfileSummaryStripProps = {
  summary: ProfileSummary;
  subscription: SubscriptionRecord;
};

export function ProfileSummaryStrip({
  summary,
  subscription,
}: ProfileSummaryStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Profile readiness"
        value={`${summary.completionPercent}%`}
        detail="How complete the personal identity and preferences layer looks right now."
      />
      <StatCard
        label="Contact fields"
        value={String(summary.contactFieldsCompleted)}
        detail="Identity fields currently filled in for this workspace."
      />
      <StatCard
        label="Preferences"
        value={String(summary.preferencesConfigured)}
        detail="Locale and currency defaults stored for the account experience."
      />
      <StatCard
        label="Plan"
        value={formatSubscriptionPlan(subscription.plan)}
        detail={`${formatBillingStatus(subscription.billingStatus)} billing via ${subscription.provider}.`}
      />
    </section>
  );
}
