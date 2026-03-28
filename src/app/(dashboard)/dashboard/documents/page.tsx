import { FeaturePlaceholderPage } from "@/components/dashboard/feature-placeholder-page";

export default function DocumentsPage() {
  return (
    <FeaturePlaceholderPage
      eyebrow="Documents"
      title="Stage the upload center for receipts, invoices, and bills"
      description="This route gives the future OCR pipeline a clear home with room for previews, extraction state, and document filtering."
      highlights={[
        "Upload dropzone",
        "Document list and filters",
        "Preview drawer",
        "Storage and signed URL integration",
      ]}
      primaryAction="Build upload center"
      secondaryAction="Connect storage helpers"
    />
  );
}
