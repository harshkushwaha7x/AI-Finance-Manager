import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AdminLeadsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Admin leads"
      title="Manage inbound demand from contact and accountant flows"
      description="This route will hold qualified lead filters, request statuses, and assignment notes for manual-first operations."
      highlights={["Lead table and filters", "Status transitions", "Admin notes", "Assignment workflow"]}
      primaryAction="Build leads inbox"
      secondaryAction="Wire admin lead queries"
    />
  );
}
