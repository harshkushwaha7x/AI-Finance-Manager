import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AuthSetupCard } from "@/components/auth/auth-setup-card";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getViewerContext } from "@/lib/auth/viewer";
import { dashboardNav } from "@/lib/constants/site";
import { getOnboardingState } from "@/lib/onboarding/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const viewer = await getViewerContext();
  const onboardingState = await getOnboardingState(viewer);

  if ((!viewer.hasClerk || viewer.isSignedIn) && !onboardingState.completed) {
    redirect("/onboarding");
  }

  return (
    <WorkspaceShell navigation={dashboardNav} label="Product workspace">
      {viewer.hasClerk && !viewer.isSignedIn ? (
        <AuthSetupCard
          title="Sign in to continue"
          description="The dashboard is ready for Clerk-protected sessions. Once your auth keys are configured, this route will require sign-in automatically."
        />
      ) : (
        children
      )}
    </WorkspaceShell>
  );
}
