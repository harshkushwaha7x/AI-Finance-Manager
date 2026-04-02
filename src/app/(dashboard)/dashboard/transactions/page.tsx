import { TransactionsWorkspace } from "@/features/transactions/transactions-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getTransactionWorkspaceState } from "@/lib/services/transactions";

export default async function TransactionsPage() {
  const viewer = await getViewerContext();
  const transactionWorkspaceState = await getTransactionWorkspaceState(viewer);

  return <TransactionsWorkspace initialState={transactionWorkspaceState} />;
}
