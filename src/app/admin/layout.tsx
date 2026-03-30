import type { ReactNode } from "react";

import { AdminGateCard } from "@/components/auth/admin-gate-card";
import { AuthSetupCard } from "@/components/auth/auth-setup-card";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getViewerContext } from "@/lib/auth/viewer";
import { adminNav } from "@/lib/constants/site";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const viewer = await getViewerContext();

  return (
    <WorkspaceShell navigation={adminNav} label="Internal admin" accentClassName="bg-secondary/10 text-secondary">
      {viewer.hasClerk && !viewer.isSignedIn ? (
        <AuthSetupCard
          title="Admin access requires sign-in"
          description="This internal console is protected by Clerk. Sign in first, then assign an admin role or allowlist your email to unlock these routes."
        />
      ) : viewer.hasClerk && !viewer.isAdmin ? (
        <AdminGateCard email={viewer.email} />
      ) : (
        children
      )}
    </WorkspaceShell>
  );
}
