import { AdminLeadsWorkspace } from "@/features/admin/admin-leads-workspace";
import { canAccessAdmin } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import { getAdminLeadWorkspaceState } from "@/lib/services/admin";

export default function AdminLeadsPage() {
  return <AdminLeadsPageServer />;
}

async function AdminLeadsPageServer() {
  const viewer = await getViewerContext();

  if (!canAccessAdmin(viewer)) {
    return null;
  }

  const state = await getAdminLeadWorkspaceState(viewer);

  return <AdminLeadsWorkspace initialState={state} />;
}
