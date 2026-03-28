import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function IncomePage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Income"
      title="Create a cleaner view of cash in"
      description="The income route is ready for salary, freelance, invoice-linked, and recurring earnings workflows."
      highlights={[
        "Income source tagging",
        "Retainer and recurring support",
        "Invoice linkage",
        "Trend visualization setup",
      ]}
      primaryAction="Build income tracking table"
      secondaryAction="Add cash-in summary cards"
    />
  );
}
