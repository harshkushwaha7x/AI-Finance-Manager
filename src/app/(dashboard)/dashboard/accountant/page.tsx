import { AccountantWorkspace } from "@/features/accountant/accountant-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getOnboardingState } from "@/lib/onboarding/server";
import { getAccountantWorkspaceState } from "@/lib/services/accountant";

export default function AccountantPage() {
  return <AccountantPageServer />;
}

async function AccountantPageServer() {
  const viewer = await getViewerContext();
  const onboardingState = await getOnboardingState(viewer);
  const accountantWorkspaceState = await getAccountantWorkspaceState(viewer);

  return (
    <AccountantWorkspace
      initialState={accountantWorkspaceState}
      initialWorkspaceName={onboardingState.workspaceName || viewer.name || "Finance workspace"}
      initialGstin={accountantWorkspaceState.requests[0]?.context.gstin || ""}
    />
  );
}
