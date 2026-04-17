import { ProfileWorkspace } from "@/features/profile/profile-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getProfileWorkspaceState } from "@/lib/services/settings";

export default async function ProfilePage() {
  const viewer = await getViewerContext();
  const workspaceState = await getProfileWorkspaceState(viewer);

  return <ProfileWorkspace initialState={workspaceState} />;
}
