import { SettingsWorkspace } from "@/features/settings/settings-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getSettingsWorkspaceState } from "@/lib/services/settings";

export default async function SettingsPage() {
  const viewer = await getViewerContext();
  const workspaceState = await getSettingsWorkspaceState(viewer);

  return <SettingsWorkspace initialState={workspaceState} />;
}
