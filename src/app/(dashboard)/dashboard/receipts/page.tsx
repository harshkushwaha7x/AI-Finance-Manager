import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function ReceiptsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Receipt review"
      title="Review extraction results before they hit the ledger"
      description="The receipt review queue will let users accept, correct, or reject AI-extracted values with confidence-based guidance."
      highlights={[
        "AI extraction status",
        "Manual correction UX",
        "Create transaction from receipt",
        "Confidence indicators",
      ]}
      primaryAction="Build receipt review panel"
      secondaryAction="Add extraction route"
    />
  );
}
