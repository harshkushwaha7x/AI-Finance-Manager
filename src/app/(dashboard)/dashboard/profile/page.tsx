import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function ProfilePage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Profile"
      title="Store the user identity layer cleanly"
      description="The profile route will manage personal details, display data, and account-level preferences once auth is live."
      highlights={[
        "Name and contact details",
        "Avatar and identity fields",
        "Personal preference controls",
        "Auth-linked persistence",
      ]}
      primaryAction="Build profile form"
      secondaryAction="Add settings schema"
    />
  );
}
