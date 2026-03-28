import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function ExpensesPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Expenses"
      title="Design a fast expense logging experience"
      description="This route will focus on quick capture, recurring expenses, merchant metadata, and monthly spend analysis."
      highlights={[
        "Quick add and detailed forms",
        "Recurring expense states",
        "Merchant and payment method fields",
        "Category breakdown widgets",
      ]}
      primaryAction="Build expense quick add flow"
      secondaryAction="Add expense summary widgets"
    />
  );
}
