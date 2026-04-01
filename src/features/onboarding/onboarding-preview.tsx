import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fiscalYearMonths,
  onboardingFocusAreas,
  onboardingProfileCards,
} from "@/lib/onboarding/constants";
import type { OnboardingInput } from "@/lib/validations/onboarding";

type OnboardingPreviewProps = {
  profileType: OnboardingInput["profileType"];
  workspaceName: string;
  fullName: string;
  currency: string;
  fiscalYearStartMonth: number;
  focusAreas: OnboardingInput["focusAreas"];
};

export function OnboardingPreview({
  profileType,
  workspaceName,
  fullName,
  currency,
  fiscalYearStartMonth,
  focusAreas,
}: OnboardingPreviewProps) {
  const profile = onboardingProfileCards.find((item) => item.value === profileType) ?? onboardingProfileCards[1];
  const monthLabel =
    fiscalYearMonths.find((month) => month.value === fiscalYearStartMonth)?.label ?? "April";

  return (
    <Card className="overflow-hidden bg-foreground text-white">
      <CardHeader className="relative bg-[radial-gradient(circle_at_top_left,rgba(21,94,239,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.32),transparent_38%)]">
        <Badge variant="secondary" className="w-fit border-white/15 bg-white/10 text-white">
          Live preview
        </Badge>
        <CardTitle className="text-white">
          {workspaceName || fullName || "Your finance workspace"} will launch as a {profile.title.toLowerCase()} setup
        </CardTitle>
        <p className="max-w-xl text-sm leading-7 text-white/72">{profile.description}</p>
      </CardHeader>
      <CardContent className="space-y-5 pt-7">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-white/55">Default configuration</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Currency</p>
              <p className="mt-2 text-sm font-semibold text-white">{currency}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Fiscal year starts</p>
              <p className="mt-2 text-sm font-semibold text-white">{monthLabel}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white/80" />
            <p className="text-sm font-semibold text-white">What the product will prioritize next</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {focusAreas.map((focusArea) => {
              const item =
                onboardingFocusAreas.find((option) => option.value === focusArea) ?? onboardingFocusAreas[0];

              return (
                <Badge
                  key={focusArea}
                  variant="secondary"
                  className="border-white/15 bg-white/10 text-white"
                >
                  {item.label}
                </Badge>
              );
            })}
          </div>
          <div className="mt-5 space-y-3">
            {profile.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/72"
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
