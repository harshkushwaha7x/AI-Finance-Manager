import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function GoalsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Goals"
      title="Turn savings intent into visible progress"
      description="Goal cards, milestones, and contribution actions will live here once the finance data model is in place."
      highlights={[
        "Target and current amount tracking",
        "Contribution actions",
        "Priority and deadline fields",
        "Completion states",
      ]}
      primaryAction="Build goal cards"
      secondaryAction="Add contribution flow"
    />
  );
}
