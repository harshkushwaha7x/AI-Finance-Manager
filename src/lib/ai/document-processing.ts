import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildInvoiceExtractionScaffoldSummary,
  buildReceiptExtractionUserPrompt,
  receiptExtractionDeveloperPrompt,
} from "@/lib/ai/prompts/document-processing";
import { appEnv } from "@/lib/env";
import { receiptExtractionResultSchema } from "@/lib/validations/finance";
import { downloadStoredDocumentAsDataUrl } from "@/lib/storage/document-storage";
import type {
  DocumentRecord,
  DocumentStatus,
  ReceiptExtractionResult,
} from "@/types/finance";

type ExtractionSource = "openai" | "fallback" | "manual" | "invoice_scaffold";

type ProcessedDocumentResult = {
  source: ExtractionSource;
  status: DocumentStatus;
  summary: string;
  extractedData: Record<string, unknown>;
  receipt: ReceiptExtractionResult | null;
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return openaiClient;
}

function titleCaseFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function fallbackReceiptExtraction(document: DocumentRecord): ReceiptExtractionResult {
  const normalizedName = document.originalName.toLowerCase();
  const defaultDate = document.createdAt.slice(0, 10);

  if (normalizedName.includes("grocery")) {
    return receiptExtractionResultSchema.parse({
      vendorName: "Nature's Basket",
      transactionDate: defaultDate,
      totalAmount: 3480,
      taxAmount: 180,
      probableCategory: "Food",
      confidence: 0.64,
      currency: "INR",
      lineItems: [
        { description: "Groceries", amount: 3120 },
        { description: "Tax", amount: 180 },
      ],
    });
  }

  if (normalizedName.includes("travel")) {
    return receiptExtractionResultSchema.parse({
      vendorName: "Uber Intercity",
      transactionDate: defaultDate,
      totalAmount: 6240,
      taxAmount: 0,
      probableCategory: "Travel",
      confidence: 0.58,
      currency: "INR",
      lineItems: [{ description: "Travel fare", amount: 6240 }],
    });
  }

  return receiptExtractionResultSchema.parse({
    vendorName: titleCaseFromFileName(document.originalName),
    transactionDate: defaultDate,
    totalAmount: Number(Math.max(499, Math.round(document.fileSize / 120))),
    taxAmount: 0,
    probableCategory: "General",
    confidence: document.mimeType.startsWith("image/") ? 0.54 : 0.41,
    currency: "INR",
    lineItems: [],
  });
}

function buildReceiptSummary(
  extraction: ReceiptExtractionResult,
  source: ExtractionSource,
) {
  const vendor = extraction.vendorName || "Vendor pending";
  const amount =
    typeof extraction.totalAmount === "number"
      ? `${extraction.currency} ${extraction.totalAmount.toFixed(2)}`
      : "amount pending";
  const date = extraction.transactionDate || "date pending";
  const sourceLabel =
    source === "openai"
      ? "OpenAI extraction"
      : source === "manual"
        ? "manual review"
        : "fallback extraction";

  return `${vendor} / ${amount} / ${date} / ${sourceLabel}`;
}

async function extractReceiptWithOpenAI(
  document: DocumentRecord,
): Promise<ReceiptExtractionResult | null> {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const imageDataUrl = await downloadStoredDocumentAsDataUrl({
    storagePath: document.storagePath,
    mimeType: document.mimeType,
  });

  if (!imageDataUrl) {
    return null;
  }

  try {
    const response = await client.responses.parse({
      model: appEnv.openaiReceiptModel,
      input: [
        {
          role: "developer",
          content: receiptExtractionDeveloperPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildReceiptExtractionUserPrompt(document),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(receiptExtractionResultSchema, "receipt_extraction"),
      },
    });

    return response.output_parsed ?? null;
  } catch {
    return null;
  }
}

export async function extractDocumentForReview(
  document: DocumentRecord,
): Promise<ProcessedDocumentResult> {
  if (document.kind === "invoice") {
    return {
      source: "invoice_scaffold",
      status: "processing",
      summary: buildInvoiceExtractionScaffoldSummary(document),
      extractedData: {
        invoiceDraft: {
          customerName: "",
          invoiceNumber: "",
          issueDate: "",
          totalAmount: null,
        },
        extractionSource: "invoice_scaffold",
        extractedAt: new Date().toISOString(),
      },
      receipt: null,
    };
  }

  const openAIExtraction =
    document.kind === "receipt" ? await extractReceiptWithOpenAI(document) : null;
  const source: ExtractionSource = openAIExtraction ? "openai" : "fallback";
  const extraction =
    document.kind === "receipt"
      ? openAIExtraction ?? fallbackReceiptExtraction(document)
      : null;

  return {
    source,
    status: extraction ? "review" : document.status,
    summary: extraction
      ? buildReceiptSummary(extraction, source)
      : "Document extraction scaffold created.",
    extractedData: extraction
      ? {
          receipt: extraction,
          extractionSource: source,
          extractedAt: new Date().toISOString(),
        }
      : {
          extractionSource: source,
          extractedAt: new Date().toISOString(),
        },
    receipt: extraction,
  };
}
