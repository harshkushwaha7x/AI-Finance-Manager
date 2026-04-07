import type { DocumentRecord } from "@/types/finance";

export const receiptExtractionDeveloperPrompt = `
You extract structured accounting data from receipts.
Return only fields that are visible or strongly implied.
Prefer INR unless another currency is explicit.
If a field is unclear, omit it instead of guessing.
Use confidence between 0 and 1.
Keep line items concise and only include the clearest items.
`.trim();

export function buildReceiptExtractionUserPrompt(document: DocumentRecord) {
  return [
    "Extract structured data from this receipt image for a finance review workflow.",
    `File name: ${document.originalName}`,
    `Mime type: ${document.mimeType}`,
    `Storage path: ${document.storagePath}`,
    "Return vendor name, transaction date, total amount, tax amount, probable category, confidence, and any visible line items.",
  ].join("\n");
}

export function buildInvoiceExtractionScaffoldSummary(document: DocumentRecord) {
  return `Invoice scaffold prepared for ${document.originalName}. The receipt OCR route is ready, and invoice-specific field extraction can build on the same processing service next.`;
}
