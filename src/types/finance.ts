import type { z } from "zod";

import {
  accountantRequestInputSchema,
  appointmentInputSchema,
  budgetInputSchema,
  documentUploadResultSchema,
  goalInputSchema,
  insightResponseSchema,
  invoiceInputSchema,
  monthlyReportResponseSchema,
  receiptExtractionResultSchema,
  transactionInputSchema,
} from "@/lib/validations/finance";

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type GoalInput = z.infer<typeof goalInputSchema>;
export type DocumentUploadResult = z.infer<typeof documentUploadResultSchema>;
export type ReceiptExtractionResult = z.infer<typeof receiptExtractionResultSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type AccountantRequestInput = z.infer<typeof accountantRequestInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;
