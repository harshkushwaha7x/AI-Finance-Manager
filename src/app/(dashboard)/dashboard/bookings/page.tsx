import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function BookingsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Bookings"
      title="Schedule accountant consultations cleanly"
      description="This route is reserved for slot selection, booking history, and request-linked appointment actions."
      highlights={[
        "Date and slot picker",
        "Booking timeline",
        "Reschedule and cancel states",
        "Meeting mode and link support",
      ]}
      primaryAction="Build scheduler UI"
      secondaryAction="Create appointments API"
    />
  );
}
