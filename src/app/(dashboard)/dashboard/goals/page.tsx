import { GoalsWorkspace } from "@/features/goals/goals-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getGoalWorkspaceState } from "@/lib/services/goals";

export default async function GoalsPage() {
  const viewer = await getViewerContext();
  const goalWorkspaceState = await getGoalWorkspaceState(viewer);

  return <GoalsWorkspace initialState={goalWorkspaceState} />;
}
