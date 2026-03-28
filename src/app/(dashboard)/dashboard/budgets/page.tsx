import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function BudgetsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Budgets"
      title="Make budget risk impossible to ignore"
      description="This page is laid out for category budgets, thresholds, alerts, and budget-versus-actual visuals."
      highlights={[
        "Budget creation and editing",
        "Threshold color states",
        "Category-linked controls",
        "Dashboard budget widgets",
      ]}
      primaryAction="Build budget cards"
      secondaryAction="Wire utilization logic"
    />
  );
}
