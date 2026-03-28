import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function ReportsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Reports"
      title="Generate monthly finance stories and exports"
      description="This page is ready for report presets, generated report history, export controls, and narrative summaries."
      highlights={[
        "Preset filters",
        "PDF and CSV exports",
        "Narrative summary block",
        "Generated history table",
      ]}
      primaryAction="Build report presets"
      secondaryAction="Implement report generation endpoint"
    />
  );
}
