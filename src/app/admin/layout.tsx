import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { adminNav } from "@/lib/constants/site";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <WorkspaceShell navigation={adminNav} label="Internal admin" accentClassName="bg-secondary/10 text-secondary">
      {children}
    </WorkspaceShell>
  );
}
