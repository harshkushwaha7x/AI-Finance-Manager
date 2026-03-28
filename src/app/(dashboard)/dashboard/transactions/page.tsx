import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function TransactionsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Transactions"
      title="Prepare a unified transaction workspace"
      description="This section will become the core ledger for expenses, income, filters, bulk actions, and AI-assisted categorization."
      highlights={[
        "Server-driven table and filters",
        "Create, edit, delete actions",
        "Category and status handling",
        "Export-ready structure",
      ]}
      primaryAction="Build transaction list UI"
      secondaryAction="Wire CRUD route handlers"
    />
  );
}
