import "server-only";

import { hydrateReceiptRecord, buildReceiptWorkspaceSummary, sortReceiptsForWorkspace } from "@/features/receipts/receipt-utils";
import type { ViewerContext } from "@/lib/auth/viewer";
import { getDocumentWorkspaceState } from "@/lib/services/documents";
import type { ReceiptWorkspaceState } from "@/types/receipts";

export async function getReceiptWorkspaceState(
  viewer: ViewerContext,
): Promise<ReceiptWorkspaceState> {
  const documentWorkspaceState = await getDocumentWorkspaceState(viewer);
  const receipts = sortReceiptsForWorkspace(
    documentWorkspaceState.documents
      .filter((document) => document.kind === "receipt")
      .map(hydrateReceiptRecord),
  );

  return {
    receipts,
    summary: buildReceiptWorkspaceSummary(receipts),
    source: documentWorkspaceState.source,
  };
}
