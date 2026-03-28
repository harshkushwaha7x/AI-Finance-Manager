import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function InsightsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="AI insights"
      title="Translate transactions into decisions"
      description="This route is reserved for structured AI spending analysis, savings opportunities, and anomaly narratives."
      highlights={[
        "Structured JSON insight output",
        "Savings recommendations",
        "Anomaly detection surface",
        "History snapshots",
      ]}
      primaryAction="Build insight cards"
      secondaryAction="Add insights API route"
    />
  );
}
