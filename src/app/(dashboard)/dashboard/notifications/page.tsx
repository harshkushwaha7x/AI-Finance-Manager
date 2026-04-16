import { NotificationsWorkspace } from "@/features/notifications/notifications-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getNotificationWorkspaceState } from "@/lib/services/notifications";

export default function NotificationsPage() {
  return <NotificationsPageServer />;
}

async function NotificationsPageServer() {
  const viewer = await getViewerContext();
  const notificationState = await getNotificationWorkspaceState(viewer);

  return <NotificationsWorkspace initialState={notificationState} />;
}
