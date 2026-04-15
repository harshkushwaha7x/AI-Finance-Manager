import { AdminPackagesWorkspace } from "@/features/admin/admin-packages-workspace";
import { canAccessAdmin } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import { getAdminPackageWorkspaceState } from "@/lib/services/admin";

export default function AdminPackagesPage() {
  return <AdminPackagesPageServer />;
}

async function AdminPackagesPageServer() {
  const viewer = await getViewerContext();

  if (!canAccessAdmin(viewer)) {
    return null;
  }

  const state = await getAdminPackageWorkspaceState(viewer);

  return <AdminPackagesWorkspace initialState={state} />;
}
