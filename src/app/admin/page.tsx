import { AdminOverview } from "@/features/admin/admin-overview";
import { canAccessAdmin } from "@/lib/auth/admin";
import { getViewerContext } from "@/lib/auth/viewer";
import { getAdminOverviewState } from "@/lib/services/admin";

export default function AdminPage() {
  return <AdminPageServer />;
}

async function AdminPageServer() {
  const viewer = await getViewerContext();

  if (!canAccessAdmin(viewer)) {
    return null;
  }

  const state = await getAdminOverviewState(viewer);

  return <AdminOverview state={state} />;
}
