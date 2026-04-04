import { BudgetsWorkspace } from "@/features/budgets/budgets-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getBudgetWorkspaceState } from "@/lib/services/budgets";

export default async function BudgetsPage() {
  const viewer = await getViewerContext();
  const budgetWorkspaceState = await getBudgetWorkspaceState(viewer);

  return <BudgetsWorkspace initialState={budgetWorkspaceState} />;
}
