import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AdminPackagesPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Admin packages"
      title="Control service packaging from one internal table"
      description="Package creation, activation, and pricing copy management will live here as the accountant service module evolves."
      highlights={[
        "Package table",
        "Create and edit modal",
        "Activation states",
        "Pricing and deliverable fields",
      ]}
      primaryAction="Build package manager"
      secondaryAction="Add package persistence"
    />
  );
}
