import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function AdminReportsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Admin reports"
      title="Review generated outputs and internal analytics"
      description="The admin reports route will track generated report runs, tax summary activity, and AI workflow output health."
      highlights={[
        "Generated output monitoring",
        "Report queue visibility",
        "Export activity review",
        "AI workflow health panels",
      ]}
      primaryAction="Build admin reporting view"
      secondaryAction="Add internal report queries"
    />
  );
}
