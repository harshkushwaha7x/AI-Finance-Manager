import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function SettingsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Settings"
      title="Prepare business defaults, plan state, and preferences"
      description="Settings is where business identity, GST details, invoice defaults, and notification controls will converge."
      highlights={[
        "Business details form",
        "Plan badge states",
        "Notification preferences",
        "Invoice default values",
      ]}
      primaryAction="Build settings sections"
      secondaryAction="Implement settings routes"
    />
  );
}
