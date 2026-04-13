import { TaxCenterWorkspace } from "@/features/tax-center/tax-center-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getTaxWorkspaceState } from "@/lib/services/tax-center";

export default function TaxCenterPage() {
  return <TaxCenterPageServer />;
}

async function TaxCenterPageServer() {
  const viewer = await getViewerContext();
  const taxWorkspaceState = await getTaxWorkspaceState(viewer);

  return <TaxCenterWorkspace initialState={taxWorkspaceState} />;
}
