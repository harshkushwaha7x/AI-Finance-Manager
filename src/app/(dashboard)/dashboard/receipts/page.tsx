import { ReceiptsWorkspace } from "@/features/receipts/receipts-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getReceiptWorkspaceState } from "@/lib/services/receipts";

export default async function ReceiptsPage() {
  const viewer = await getViewerContext();
  const receiptWorkspaceState = await getReceiptWorkspaceState(viewer);

  return <ReceiptsWorkspace initialState={receiptWorkspaceState} />;
}
