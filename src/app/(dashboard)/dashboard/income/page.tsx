import { IncomeWorkspace } from "@/features/income/income-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getIncomeWorkspaceState } from "@/lib/services/income";

export default async function IncomePage() {
  const viewer = await getViewerContext();
  const incomeWorkspaceState = await getIncomeWorkspaceState(viewer);

  return <IncomeWorkspace initialState={incomeWorkspaceState} />;
}
