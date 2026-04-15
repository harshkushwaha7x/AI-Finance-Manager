import { AdminUsersWorkspace } from "@/features/admin/admin-users-workspace";
import { canAccessAdmin } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import { getAdminUserWorkspaceState } from "@/lib/services/admin";

export default function AdminUsersPage() {
  return <AdminUsersPageServer />;
}

async function AdminUsersPageServer() {
  const viewer = await getViewerContext();

  if (!canAccessAdmin(viewer)) {
    return null;
  }

  const state = await getAdminUserWorkspaceState(viewer);

  return <AdminUsersWorkspace initialState={state} />;
}
