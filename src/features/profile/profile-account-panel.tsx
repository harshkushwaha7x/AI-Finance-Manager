import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ProfileRecord,
  ProfileSummary,
  SettingsSource,
  SubscriptionRecord,
} from "@/types/settings";
import {
  formatBillingStatus,
  formatJoinedDate,
  formatProfileTypeLabel,
  formatSubscriptionPlan,
  getProfileIdentityCoverage,
} from "@/features/profile/profile-utils";

type ProfileAccountPanelProps = {
  profile: ProfileRecord;
  summary: ProfileSummary;
  subscription: SubscriptionRecord;
  source: SettingsSource;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-black/6 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ProfileAccountPanel({
  profile,
  summary,
  subscription,
  source,
}: ProfileAccountPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Account state</CardTitle>
          <Badge variant={source === "database" ? "success" : "secondary"}>
            {source === "database" ? "Database live" : "Demo persistence"}
          </Badge>
        </div>
        <CardDescription>
          This panel gives a recruiter-friendly snapshot of how the user identity layer is wired
          into the SaaS product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-[1.5rem] border border-black/6 bg-surface-subtle p-5">
          <p className="font-display text-2xl font-bold text-foreground">{profile.workspaceName}</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            {formatProfileTypeLabel(profile.profileType)} with {formatSubscriptionPlan(subscription.plan)}
            {" "}plan status set to {formatBillingStatus(subscription.billingStatus)}.
          </p>
        </div>

        <div className="space-y-1">
          <DetailRow label="Account email" value={profile.email} />
          <DetailRow label="Joined" value={formatJoinedDate(profile.joinedAt)} />
          <DetailRow label="Identity coverage" value={getProfileIdentityCoverage(profile)} />
          <DetailRow label="Readiness score" value={`${summary.completionPercent}%`} />
          <DetailRow
            label="Onboarding state"
            value={profile.onboardingCompleted ? "Completed" : "Still in setup"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
