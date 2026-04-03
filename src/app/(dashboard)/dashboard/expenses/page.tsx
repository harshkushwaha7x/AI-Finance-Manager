import { ExpensesWorkspace } from "@/features/expenses/expenses-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getExpensesWorkspaceState } from "@/lib/services/expenses";

export default async function ExpensesPage() {
  const viewer = await getViewerContext();
  const expenseWorkspaceState = await getExpensesWorkspaceState(viewer);

  return <ExpensesWorkspace initialState={expenseWorkspaceState} />;
}
