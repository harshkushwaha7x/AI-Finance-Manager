import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AccountantPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Accountant services"
      title="Convert finance pain into service-qualified demand"
      description="This route will hold package cards, a request form, status tracking, and supporting document context."
      highlights={[
        "Package comparison cards",
        "Request form flow",
        "Status timeline",
        "Admin handoff ready data",
      ]}
      primaryAction="Build service package cards"
      secondaryAction="Add request API route"
    />
  );
}
