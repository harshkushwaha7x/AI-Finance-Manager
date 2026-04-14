import { BookingsWorkspace } from "@/features/bookings/bookings-workspace";
import { getViewerContext } from "@/lib/auth/viewer";
import { getBookingWorkspaceState } from "@/lib/services/appointments";

export default function BookingsPage() {
  return <BookingsPageServer />;
}

async function BookingsPageServer() {
  const viewer = await getViewerContext();
  const bookingWorkspaceState = await getBookingWorkspaceState(viewer);

  return <BookingsWorkspace initialState={bookingWorkspaceState} />;
}
