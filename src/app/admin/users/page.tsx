import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AdminUsersPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Admin users"
      title="Add a support-facing user lookup surface"
      description="This route provides a future home for support context, account health, and user-level request history."
      highlights={[
        "User lookup table",
        "Support-facing profile view",
        "Linked service requests",
        "Plan and onboarding visibility",
      ]}
      primaryAction="Build user list view"
      secondaryAction="Add support context queries"
    />
  );
}
