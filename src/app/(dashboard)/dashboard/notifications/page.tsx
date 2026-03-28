import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function NotificationsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Notifications"
      title="Aggregate key alerts across finance, AI, and service workflows"
      description="Budget risk, report generation, booking updates, and AI events will eventually roll up here."
      highlights={[
        "In-app inbox",
        "Read and unread state",
        "Event-driven helper hooks",
        "CTA-linked notification cards",
      ]}
      primaryAction="Build notifications center"
      secondaryAction="Add notification helpers"
    />
  );
}
