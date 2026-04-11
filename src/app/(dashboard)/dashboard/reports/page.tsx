import { ReportsWorkspace } from "@/features/reports/reports-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getReportWorkspaceState } from "@/lib/services/reports";

export default async function ReportsPage() {
  const viewer = await getViewerContext();
  const reportWorkspaceState = await getReportWorkspaceState(viewer);

  return <ReportsWorkspace initialState={reportWorkspaceState} />;
}
