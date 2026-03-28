import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function InvoicesPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Invoices"
      title="Give freelancers and SMBs a polished invoicing lane"
      description="Invoice composition, preview, status tracking, and GST-aware totals will be built on top of this scaffold."
      highlights={[
        "Invoice composer",
        "Line items and tax inputs",
        "Printable template",
        "Paid-to-income workflow",
      ]}
      primaryAction="Build invoice composer"
      secondaryAction="Wire invoice persistence"
    />
  );
}
