import { DocumentsWorkspace } from "@/features/documents/documents-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getDocumentWorkspaceState } from "@/lib/services/documents";

export default async function DocumentsPage() {
  const viewer = await getViewerContext();
  const documentWorkspaceState = await getDocumentWorkspaceState(viewer);

  return <DocumentsWorkspace initialState={documentWorkspaceState} />;
}
