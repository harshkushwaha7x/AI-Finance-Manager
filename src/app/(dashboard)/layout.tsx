import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { dashboardNav } from "@/lib/constants/site";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <WorkspaceShell navigation={dashboardNav} label="Product workspace">
      {children}
    </WorkspaceShell>
  );
}
