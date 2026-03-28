import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function TaxCenterPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Tax center"
      title="Surface GST-ready context in one place"
      description="This route is designed for India-first tax summaries, checklist surfaces, and accountant collaboration handoff."
      highlights={[
        "GST summary widgets",
        "Tax document checklist",
        "Period filters",
        "Export-ready sections",
      ]}
      primaryAction="Build GST summary widgets"
      secondaryAction="Implement tax aggregation service"
    />
  );
}
