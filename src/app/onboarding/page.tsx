import type { Metadata } from "next";

import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { PageHeader } from "@/components/shared/page-header";
import { SiteContainer } from "@/components/shared/site-container";
import { getViewerContext } from "@/lib/auth/viewer";
import { buildMetadata } from "@/lib/metadata";
import { onboardingDefaultValues } from "@/lib/onboarding/constants";
import { getOnboardingState } from "@/lib/onboarding/server";

export const metadata: Metadata = buildMetadata({
  title: "Onboarding",
  description:
    "Configure the AI Finance Manager workspace, set profile preferences, and seed the dashboard with the right finance story.",
  path: "/onboarding",
});

export default async function OnboardingPage() {
  const viewer = await getViewerContext();
  const onboardingState = await getOnboardingState(viewer);

  const initialValues = {
    ...onboardingDefaultValues,
    profileType: onboardingState.profileType,
    fullName: onboardingState.fullName,
    workspaceName: onboardingState.workspaceName,
    currency: onboardingState.currency,
    fiscalYearStartMonth: onboardingState.fiscalYearStartMonth,
    monthlyIncomeTarget: onboardingState.monthlyIncomeTarget,
    monthlyBudgetTarget: onboardingState.monthlyBudgetTarget,
    focusAreas: onboardingState.focusAreas,
    email: viewer.email ?? "",
    legalName: "",
    gstin: "",
  };

  return (
    <section className="py-10 sm:py-14">
      <SiteContainer className="space-y-8">
        <PageHeader
          eyebrow="Onboarding"
          title="Configure the finance workspace before you enter the product"
          description="This setup step makes the dashboard feel personalized from day one, seeds realistic demo data, and prepares the repo for later database-backed onboarding flows."
          badge={onboardingState.completed ? "Configured" : "Required"}
        />
        <OnboardingForm initialValues={initialValues} />
      </SiteContainer>
    </section>
  );
}
