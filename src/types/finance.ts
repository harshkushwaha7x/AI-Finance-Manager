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
  transactionCategoryOptionSchema,
  transactionFiltersSchema,
  transactionInputSchema,
  transactionRecordSchema,
  transactionSummarySchema,
  transactionUpdateSchema,
  transactionWorkspaceStateSchema,
} from "@/lib/validations/finance";

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransactionFormInput = z.input<typeof transactionInputSchema>;
export type TransactionFormValues = z.infer<typeof transactionInputSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type TransactionRecord = z.infer<typeof transactionRecordSchema>;
export type TransactionCategoryOption = z.infer<typeof transactionCategoryOptionSchema>;
export type TransactionSummary = z.infer<typeof transactionSummarySchema>;
export type TransactionWorkspaceState = z.infer<typeof transactionWorkspaceStateSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type GoalInput = z.infer<typeof goalInputSchema>;
export type DocumentUploadResult = z.infer<typeof documentUploadResultSchema>;
export type ReceiptExtractionResult = z.infer<typeof receiptExtractionResultSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type AccountantRequestInput = z.infer<typeof accountantRequestInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;
