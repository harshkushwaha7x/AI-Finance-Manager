import { CheckCircle2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionRecord } from "@/types/settings";
import {
  formatSettingsBillingStatus,
  formatSettingsPlan,
  getPlanFeatureList,
} from "@/features/settings/settings-utils";

type PlanOverviewCardProps = {
  subscription: SubscriptionRecord;
};

export function PlanOverviewCard({ subscription }: PlanOverviewCardProps) {
  const features = getPlanFeatureList(subscription.plan);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Plan and subscription state</CardTitle>
          <Badge variant={subscription.plan === "free" ? "secondary" : "primary"}>
            {formatSettingsPlan(subscription.plan)}
          </Badge>
        </div>
        <CardDescription>
          This plan surface makes the repo feel SaaS-native even before real billing is layered in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[1.5rem] border border-black/6 bg-surface-subtle p-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">
              {formatSettingsBillingStatus(subscription.billingStatus)} via {subscription.provider}
            </p>
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">
            {subscription.renewalDate
              ? `Renewal target: ${new Intl.DateTimeFormat("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(subscription.renewalDate))}.`
              : "Manual billing mode is active for this portfolio build."}
          </p>
        </div>

        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-[1.2rem] border border-black/6 bg-background px-4 py-4"
            >
              <CheckCircle2 className="mt-1 h-4 w-4 text-success" />
              <p className="text-sm leading-7 text-muted">{feature}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
