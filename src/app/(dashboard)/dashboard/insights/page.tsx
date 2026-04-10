import { InsightsWorkspace } from "@/features/insights/insights-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getInsightWorkspaceState } from "@/lib/services/insights";

export default async function InsightsPage() {
  const viewer = await getViewerContext();
  const insightWorkspaceState = await getInsightWorkspaceState(viewer);

  return <InsightsWorkspace initialState={insightWorkspaceState} />;
}
