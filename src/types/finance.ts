import type { z } from "zod";

import {
  accountantRequestInputSchema,
  appointmentInputSchema,
  budgetAlertSchema,
  budgetInputSchema,
  budgetRecordSchema,
  budgetStatusSchema,
  budgetSummarySchema,
  budgetWorkspaceStateSchema,
  documentCreateInputSchema,
  documentKindSchema,
  documentRecordSchema,
  documentSignedUploadRequestSchema,
  documentSignedUploadTargetSchema,
  documentStatusSchema,
  documentSummarySchema,
  documentUploadResultSchema,
  documentWorkspaceStateSchema,
  goalContributionInputSchema,
  goalInputSchema,
  goalRecordSchema,
  goalSummarySchema,
  goalWorkspaceStateSchema,
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
export type BudgetFormInput = z.input<typeof budgetInputSchema>;
export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type BudgetRecord = z.infer<typeof budgetRecordSchema>;
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;
export type BudgetAlert = z.infer<typeof budgetAlertSchema>;
export type BudgetWorkspaceState = z.infer<typeof budgetWorkspaceStateSchema>;
export type GoalInput = z.infer<typeof goalInputSchema>;
export type GoalFormInput = z.input<typeof goalInputSchema>;
export type GoalContributionInput = z.infer<typeof goalContributionInputSchema>;
export type GoalContributionFormInput = z.input<typeof goalContributionInputSchema>;
export type GoalRecord = z.infer<typeof goalRecordSchema>;
export type GoalSummary = z.infer<typeof goalSummarySchema>;
export type GoalWorkspaceState = z.infer<typeof goalWorkspaceStateSchema>;
export type DocumentKind = z.infer<typeof documentKindSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateInputSchema>;
export type DocumentRecord = z.infer<typeof documentRecordSchema>;
export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type DocumentWorkspaceState = z.infer<typeof documentWorkspaceStateSchema>;
export type DocumentSignedUploadRequest = z.infer<typeof documentSignedUploadRequestSchema>;
export type DocumentSignedUploadTarget = z.infer<typeof documentSignedUploadTargetSchema>;
export type DocumentUploadResult = z.infer<typeof documentUploadResultSchema>;
export type ReceiptExtractionResult = z.infer<typeof receiptExtractionResultSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type AccountantRequestInput = z.infer<typeof accountantRequestInputSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;
