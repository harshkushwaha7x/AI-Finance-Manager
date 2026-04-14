import type { z } from "zod";

import {
  accountantPackageRecordSchema,
  accountantRequestInputSchema,
  accountantRequestRecordSchema,
  accountantRequestStatusSchema,
  accountantRequestSummarySchema,
  accountantRequestContextSchema,
  accountantDocumentOptionSchema,
  accountantWorkspaceStateSchema,
  appointmentInputSchema,
  appointmentRecordSchema,
  appointmentStatusSchema,
  appointmentSummarySchema,
  appointmentUpdateSchema,
  bookingWorkspaceStateSchema,
  budgetAlertSchema,
  budgetInputSchema,
  budgetRecordSchema,
  budgetStatusSchema,
  budgetSummarySchema,
  budgetWorkspaceStateSchema,
  categorizationApplyItemSchema,
  categorizationRequestSchema,
  categorizationSuggestionSchema,
  documentCreateInputSchema,
  documentExtractionRequestSchema,
  documentKindSchema,
  documentRecordSchema,
  documentSignedUploadRequestSchema,
  documentSignedUploadTargetSchema,
  documentStatusSchema,
  documentSummarySchema,
  documentUpdateInputSchema,
  documentUploadResultSchema,
  documentWorkspaceStateSchema,
  goalContributionInputSchema,
  goalInputSchema,
  goalRecordSchema,
  insightHistoryRecordSchema,
  insightRequestSchema,
  goalSummarySchema,
  goalWorkspaceStateSchema,
  insightResponseSchema,
  insightSuggestionItemSchema,
  insightWorkspaceStateSchema,
  invoiceInputSchema,
  invoiceItemRecordSchema,
  invoiceRecordSchema,
  invoiceSummarySchema,
  invoiceWorkspaceStateSchema,
  monthlyReportResponseSchema,
  reportBudgetSummarySchema,
  reportCategoryBreakdownItemSchema,
  reportGoalSummarySchema,
  reportHistoryRecordSchema,
  reportRequestSchema,
  reportTransactionSummarySchema,
  reportTrendPointSchema,
  reportWorkspaceStateSchema,
  receiptExtractionResultSchema,
  taxBreakdownSchema,
  taxChecklistItemSchema,
  taxDocumentHighlightSchema,
  taxInvoiceHighlightSchema,
  taxNotesInputSchema,
  taxPeriodSchema,
  taxSummarySchema,
  taxWorkspaceStateSchema,
  transactionCategoryOptionSchema,
  transactionFiltersSchema,
  transactionInputSchema,
  transactionRecordSchema,
  transactionRuleRecordSchema,
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
export type TransactionRuleRecord = z.infer<typeof transactionRuleRecordSchema>;
export type TransactionWorkspaceState = z.infer<typeof transactionWorkspaceStateSchema>;
export type CategorizationSuggestion = z.infer<typeof categorizationSuggestionSchema>;
export type CategorizationApplyItem = z.infer<typeof categorizationApplyItemSchema>;
export type CategorizationRequest = z.infer<typeof categorizationRequestSchema>;
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
export type DocumentUpdateInput = z.infer<typeof documentUpdateInputSchema>;
export type DocumentRecord = z.infer<typeof documentRecordSchema>;
export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type DocumentWorkspaceState = z.infer<typeof documentWorkspaceStateSchema>;
export type DocumentExtractionRequest = z.infer<typeof documentExtractionRequestSchema>;
export type DocumentSignedUploadRequest = z.infer<typeof documentSignedUploadRequestSchema>;
export type DocumentSignedUploadTarget = z.infer<typeof documentSignedUploadTargetSchema>;
export type DocumentUploadResult = z.infer<typeof documentUploadResultSchema>;
export type ReceiptExtractionResult = z.infer<typeof receiptExtractionResultSchema>;
export type InsightSuggestionItem = z.infer<typeof insightSuggestionItemSchema>;
export type InsightResponse = z.infer<typeof insightResponseSchema>;
export type InsightHistoryRecord = z.infer<typeof insightHistoryRecordSchema>;
export type InsightWorkspaceState = z.infer<typeof insightWorkspaceStateSchema>;
export type InsightRequest = z.infer<typeof insightRequestSchema>;
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type InvoiceFormInput = z.input<typeof invoiceInputSchema>;
export type InvoiceItemRecord = z.infer<typeof invoiceItemRecordSchema>;
export type InvoiceRecord = z.infer<typeof invoiceRecordSchema>;
export type InvoiceSummary = z.infer<typeof invoiceSummarySchema>;
export type InvoiceWorkspaceState = z.infer<typeof invoiceWorkspaceStateSchema>;
export type AccountantPackageRecord = z.infer<typeof accountantPackageRecordSchema>;
export type AccountantRequestInput = z.infer<typeof accountantRequestInputSchema>;
export type AccountantRequestContext = z.infer<typeof accountantRequestContextSchema>;
export type AccountantRequestStatus = z.infer<typeof accountantRequestStatusSchema>;
export type AccountantRequestRecord = z.infer<typeof accountantRequestRecordSchema>;
export type AccountantRequestSummary = z.infer<typeof accountantRequestSummarySchema>;
export type AccountantDocumentOption = z.infer<typeof accountantDocumentOptionSchema>;
export type AccountantWorkspaceState = z.infer<typeof accountantWorkspaceStateSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;
export type AppointmentFormInput = z.input<typeof appointmentInputSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
export type AppointmentRecord = z.infer<typeof appointmentRecordSchema>;
export type AppointmentSummary = z.infer<typeof appointmentSummarySchema>;
export type BookingWorkspaceState = z.infer<typeof bookingWorkspaceStateSchema>;
export type MonthlyReportResponse = z.infer<typeof monthlyReportResponseSchema>;
export type ReportRequest = z.infer<typeof reportRequestSchema>;
export type ReportTrendPoint = z.infer<typeof reportTrendPointSchema>;
export type ReportCategoryBreakdownItem = z.infer<typeof reportCategoryBreakdownItemSchema>;
export type ReportBudgetSummary = z.infer<typeof reportBudgetSummarySchema>;
export type ReportGoalSummary = z.infer<typeof reportGoalSummarySchema>;
export type ReportTransactionSummary = z.infer<typeof reportTransactionSummarySchema>;
export type ReportHistoryRecord = z.infer<typeof reportHistoryRecordSchema>;
export type ReportWorkspaceState = z.infer<typeof reportWorkspaceStateSchema>;
export type TaxPeriod = z.infer<typeof taxPeriodSchema>;
export type TaxChecklistItem = z.infer<typeof taxChecklistItemSchema>;
export type TaxInvoiceHighlight = z.infer<typeof taxInvoiceHighlightSchema>;
export type TaxDocumentHighlight = z.infer<typeof taxDocumentHighlightSchema>;
export type TaxSummary = z.infer<typeof taxSummarySchema>;
export type TaxBreakdown = z.infer<typeof taxBreakdownSchema>;
export type TaxNotesInput = z.infer<typeof taxNotesInputSchema>;
export type TaxWorkspaceState = z.infer<typeof taxWorkspaceStateSchema>;
