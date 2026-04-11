import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

const dateTimeStringSchema = z.string().min(1, "A date and time is required.");
const optionalShortTextSchema = z.string().max(120).optional().or(z.literal(""));
const optionalLongTextSchema = z.string().max(500).optional().or(z.literal(""));
const optionalUuidSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid().optional(),
);

const currencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter currency code.")
  .transform((value) => value.toUpperCase());

const moneySchema = z.coerce.number().nonnegative("Amount must be zero or greater.");
const confidenceScoreSchema = z.coerce.number().min(0).max(1);

export const transactionInputSchema = z.object({
  businessProfileId: optionalUuidSchema,
  categoryId: optionalUuidSchema,
  type: z.enum(["expense", "income", "transfer"]),
  source: z.enum(["manual", "receipt", "invoice", "ai"]).default("manual"),
  title: z.string().min(2, "Title is required."),
  description: optionalLongTextSchema,
  merchantName: optionalShortTextSchema,
  amount: moneySchema,
  currency: currencyCodeSchema.default("INR"),
  transactionDate: dateStringSchema,
  paymentMethod: optionalShortTextSchema,
  status: z.enum(["pending", "cleared"]).default("cleared"),
  recurring: z.boolean().default(false),
  recurringInterval: z.string().max(60).optional().or(z.literal("")),
  notes: optionalLongTextSchema,
});

export const transactionUpdateSchema = transactionInputSchema.partial().extend({
  id: z.string().uuid("A transaction id is required."),
});

export const transactionFiltersSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  type: z.enum(["all", "expense", "income", "transfer"]).optional().default("all"),
  status: z.enum(["all", "pending", "cleared"]).optional().default("all"),
  category: z.string().trim().max(120).optional().default("all"),
  dateFrom: z.union([dateStringSchema, z.literal(""), z.undefined()]).default(""),
  dateTo: z.union([dateStringSchema, z.literal(""), z.undefined()]).default(""),
});

export const transactionCategoryOptionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  slug: z.string().min(1),
  kind: z.enum(["expense", "income"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const transactionRecordSchema = transactionInputSchema.extend({
  id: z.string().uuid(),
  categoryLabel: z.string().min(1),
  aiCategoryConfidence: confidenceScoreSchema.optional(),
  aiCategorySummary: z.string().max(240).optional().or(z.literal("")),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const transactionSummarySchema = z.object({
  incomeTotal: moneySchema,
  expenseTotal: moneySchema,
  reviewCount: z.coerce.number().int().min(0),
  recurringCount: z.coerce.number().int().min(0),
  categorizationQueueCount: z.coerce.number().int().min(0),
  netCashflow: z.coerce.number(),
});

export const transactionRuleRecordSchema = z.object({
  id: z.string().uuid(),
  matchField: z.enum(["merchant", "title", "description"]),
  matchValue: z.string().min(1),
  categoryId: z.string().uuid(),
  categoryLabel: z.string().min(1),
  createdBy: z.enum(["user", "ai"]),
  active: z.boolean(),
  lastAppliedAt: dateTimeStringSchema.optional(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const transactionWorkspaceStateSchema = z.object({
  transactions: z.array(transactionRecordSchema),
  categories: z.array(transactionCategoryOptionSchema),
  summary: transactionSummarySchema,
  rules: z.array(transactionRuleRecordSchema).default([]),
  source: z.enum(["demo", "database"]),
});

export const budgetInputSchema = z.object({
  businessProfileId: optionalUuidSchema,
  categoryId: optionalUuidSchema,
  name: z.string().min(2, "Budget name is required."),
  limitAmount: moneySchema,
  period: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  alertPercent: z.coerce.number().int().min(1).max(100).default(80),
  carryForward: z.boolean().default(false),
});

export const budgetStatusSchema = z.enum(["healthy", "watch", "over"]);

export const budgetRecordSchema = budgetInputSchema.extend({
  id: z.string().uuid(),
  categoryLabel: z.string().min(1),
  categoryColor: z.string().optional(),
  spentAmount: moneySchema,
  remainingAmount: z.coerce.number(),
  utilizationPercent: z.coerce.number().min(0),
  daysRemaining: z.coerce.number().int(),
  status: budgetStatusSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const budgetSummarySchema = z.object({
  totalBudgeted: moneySchema,
  totalSpent: moneySchema,
  totalRemaining: z.coerce.number(),
  activeCount: z.coerce.number().int().min(0),
  healthyCount: z.coerce.number().int().min(0),
  watchCount: z.coerce.number().int().min(0),
  overCount: z.coerce.number().int().min(0),
});

export const budgetAlertSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: budgetStatusSchema,
  tone: z.enum(["success", "warning", "danger", "secondary"]),
});

export const budgetWorkspaceStateSchema = z.object({
  budgets: z.array(budgetRecordSchema),
  categories: z.array(transactionCategoryOptionSchema),
  summary: budgetSummarySchema,
  alerts: z.array(budgetAlertSchema),
  source: z.enum(["demo", "database"]),
});

const optionalGoalTargetDateSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  dateStringSchema.optional(),
);

export const goalInputSchema = z.object({
  title: z.string().min(2, "Goal title is required."),
  description: optionalLongTextSchema,
  targetAmount: moneySchema,
  currentAmount: moneySchema.default(0),
  targetDate: optionalGoalTargetDateSchema,
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  icon: z.string().max(60).optional().or(z.literal("")),
});

export const goalContributionInputSchema = z.object({
  amount: z.coerce.number().positive("Contribution amount must be greater than zero."),
});

export const goalRecordSchema = goalInputSchema.extend({
  id: z.string().uuid(),
  progressPercent: z.coerce.number().min(0),
  remainingAmount: z.coerce.number(),
  daysRemaining: z.coerce.number().int().nullable(),
  milestoneLabel: z.string().min(1),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const goalSummarySchema = z.object({
  totalTarget: moneySchema,
  totalCurrent: moneySchema,
  activeCount: z.coerce.number().int().min(0),
  completedCount: z.coerce.number().int().min(0),
  highPriorityCount: z.coerce.number().int().min(0),
  dueSoonCount: z.coerce.number().int().min(0),
});

export const goalWorkspaceStateSchema = z.object({
  goals: z.array(goalRecordSchema),
  summary: goalSummarySchema,
  source: z.enum(["demo", "database"]),
});

export const documentKindSchema = z.enum(["receipt", "invoice", "bill", "tax_doc", "other"]);
export const documentStatusSchema = z.enum([
  "uploaded",
  "processing",
  "review",
  "failed",
  "completed",
]);

export const documentUploadResultSchema = z.object({
  documentId: z.string().uuid(),
  storagePath: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  kind: documentKindSchema,
});

export const documentSignedUploadRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  kind: documentKindSchema.optional(),
});

export const documentSignedUploadTargetSchema = z.object({
  bucket: z.string().min(1),
  storagePath: z.string().min(1),
  signedUrl: z.string().url().optional(),
  token: z.string().optional(),
  source: z.enum(["supabase", "demo"]),
});

export const documentCreateInputSchema = z.object({
  businessProfileId: optionalUuidSchema,
  kind: documentKindSchema,
  originalName: z.string().min(1),
  storagePath: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  status: documentStatusSchema.default("uploaded"),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  aiSummary: optionalLongTextSchema,
  reviewedAt: dateTimeStringSchema.optional(),
});

export const documentUpdateInputSchema = documentCreateInputSchema.partial();

export const documentRecordSchema = documentCreateInputSchema.extend({
  id: z.string().uuid(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const documentSummarySchema = z.object({
  totalCount: z.coerce.number().int().min(0),
  receiptCount: z.coerce.number().int().min(0),
  reviewCount: z.coerce.number().int().min(0),
  processingCount: z.coerce.number().int().min(0),
  failedCount: z.coerce.number().int().min(0),
});

export const documentWorkspaceStateSchema = z.object({
  documents: z.array(documentRecordSchema),
  summary: documentSummarySchema,
  source: z.enum(["demo", "database"]),
});

export const documentExtractionRequestSchema = z.object({
  documentId: z.string().uuid(),
});

export const receiptExtractionResultSchema = z.object({
  vendorName: z.string().optional(),
  transactionDate: dateStringSchema.optional(),
  totalAmount: moneySchema.optional(),
  taxAmount: moneySchema.optional(),
  currency: currencyCodeSchema.default("INR"),
  probableCategory: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        amount: moneySchema,
      }),
    )
    .default([]),
});

export const categorizationSuggestionSchema = z.object({
  transactionId: z.string().uuid(),
  transactionTitle: z.string().min(1),
  merchantName: z.string().optional().or(z.literal("")),
  transactionType: z.enum(["expense", "income", "transfer"]),
  suggestedCategoryId: z.string().uuid(),
  suggestedCategoryLabel: z.string().min(1),
  confidence: confidenceScoreSchema,
  reason: z.string().min(1),
  ruleMatchField: z.enum(["merchant", "title", "description"]).optional(),
  ruleMatchValue: z.string().optional().or(z.literal("")),
  source: z.enum(["openai", "heuristic", "rule"]),
});

export const categorizationApplyItemSchema = z.object({
  transactionId: z.string().uuid(),
  suggestedCategoryId: z.string().uuid(),
  confidence: confidenceScoreSchema,
  reason: z.string().min(1),
  saveRule: z.boolean().default(false),
  ruleMatchField: z.enum(["merchant", "title", "description"]).optional(),
  ruleMatchValue: z.string().optional().or(z.literal("")),
});

export const categorizationRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("suggest"),
    transactionIds: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    action: z.literal("apply"),
    suggestions: z.array(categorizationApplyItemSchema).min(1),
  }),
]);

export const insightSuggestionItemSchema = z.object({
  title: z.string(),
  rationale: z.string(),
  estimatedSavings: moneySchema,
  priority: z.enum(["low", "medium", "high"]),
});

export const insightResponseSchema = z.object({
  summary: z.string(),
  anomalies: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  suggestions: z.array(insightSuggestionItemSchema).default([]),
});

export const insightHistoryRecordSchema = z.object({
  id: z.string().uuid(),
  generatedAt: dateTimeStringSchema,
  periodLabel: z.string().min(1),
  source: z.enum(["openai", "fallback"]),
  response: insightResponseSchema,
  totalEstimatedSavings: moneySchema,
});

export const insightWorkspaceStateSchema = z.object({
  current: insightHistoryRecordSchema,
  history: z.array(insightHistoryRecordSchema),
  source: z.enum(["demo", "database"]),
});

export const insightRequestSchema = z.object({
  regenerate: z.boolean().default(true),
});

export const reportRequestSchema = z.object({
  reportType: z
    .enum(["monthly_summary", "cashflow", "budget", "tax", "custom"])
    .default("monthly_summary"),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
  periodStart: dateStringSchema,
  periodEnd: dateStringSchema,
});

export const reportTrendPointSchema = z.object({
  date: dateStringSchema,
  income: moneySchema,
  expenses: moneySchema,
  netCashflow: z.coerce.number(),
});

export const reportCategoryBreakdownItemSchema = z.object({
  label: z.string().min(1),
  amount: moneySchema,
  sharePercent: z.coerce.number().min(0),
});

export const reportBudgetSummarySchema = z.object({
  totalBudgeted: moneySchema,
  totalSpent: moneySchema,
  totalRemaining: z.coerce.number(),
  activeCount: z.coerce.number().int().min(0),
  watchCount: z.coerce.number().int().min(0),
  overCount: z.coerce.number().int().min(0),
});

export const reportGoalSummarySchema = z.object({
  activeCount: z.coerce.number().int().min(0),
  completedCount: z.coerce.number().int().min(0),
  dueSoonCount: z.coerce.number().int().min(0),
  fundedAmount: moneySchema,
  targetAmount: moneySchema,
});

export const reportTransactionSummarySchema = z.object({
  transactionCount: z.coerce.number().int().min(0),
  incomeCount: z.coerce.number().int().min(0),
  expenseCount: z.coerce.number().int().min(0),
  pendingCount: z.coerce.number().int().min(0),
  uncategorizedCount: z.coerce.number().int().min(0),
  recurringCount: z.coerce.number().int().min(0),
});

export const invoiceItemInputSchema = z.object({
  description: z.string().min(2, "Description is required."),
  quantity: z.coerce.number().positive(),
  unitPrice: moneySchema,
  gstRate: z.coerce.number().min(0).max(100).default(18),
});

export const invoiceInputSchema = z.object({
  businessProfileId: optionalUuidSchema,
  invoiceNumber: z.string().min(2, "Invoice number is required."),
  customerName: z.string().min(2, "Customer name is required."),
  customerEmail: z.string().email("Enter a valid customer email.").optional().or(z.literal("")),
  customerGstin: z.string().max(30).optional().or(z.literal("")),
  issueDate: dateStringSchema,
  dueDate: z.union([dateStringSchema, z.literal(""), z.undefined()]).default(""),
  currency: currencyCodeSchema.default("INR"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  notes: optionalLongTextSchema,
  items: z.array(invoiceItemInputSchema).min(1, "Add at least one invoice item."),
});

export const invoiceItemRecordSchema = invoiceItemInputSchema.extend({
  id: z.string().min(1),
  taxAmount: moneySchema,
  lineTotal: moneySchema,
});

export const invoiceRecordSchema = invoiceInputSchema.extend({
  id: z.string().uuid(),
  subtotal: moneySchema,
  taxAmount: moneySchema,
  totalAmount: moneySchema,
  dueInDays: z.coerce.number().int().nullable(),
  linkedIncomeTransactionId: z.string().uuid().optional(),
  items: z.array(invoiceItemRecordSchema),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const invoiceSummarySchema = z.object({
  totalInvoiceValue: moneySchema,
  paidValue: moneySchema,
  outstandingValue: moneySchema,
  overdueCount: z.coerce.number().int().min(0),
  draftCount: z.coerce.number().int().min(0),
  paidCount: z.coerce.number().int().min(0),
});

export const invoiceWorkspaceStateSchema = z.object({
  invoices: z.array(invoiceRecordSchema),
  summary: invoiceSummarySchema,
  source: z.enum(["demo", "database"]),
});

export const accountantRequestInputSchema = z.object({
  businessProfileId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  requestType: z.enum(["consultation", "gst", "bookkeeping", "filing", "custom"]),
  message: z.string().min(12, "Please add more detail."),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  preferredDate: dateTimeStringSchema.optional(),
});

export const appointmentInputSchema = z.object({
  requestId: z.string().uuid(),
  meetingMode: z.enum(["google_meet", "phone", "onsite"]),
  scheduledFor: dateTimeStringSchema,
  durationMinutes: z.coerce.number().int().min(15).max(240).default(30),
  meetingLink: z.string().url("Enter a valid meeting link.").optional().or(z.literal("")),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "rescheduled"]).default("pending"),
});

export const monthlyReportResponseSchema = z.object({
  reportType: z.enum(["monthly_summary", "cashflow", "budget", "tax", "custom"]),
  periodStart: dateStringSchema,
  periodEnd: dateStringSchema,
  totals: z.object({
    income: moneySchema,
    expenses: moneySchema,
    savings: z.coerce.number(),
  }),
  highlights: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  topCategories: z.array(reportCategoryBreakdownItemSchema).default([]),
  cashflowTrend: z.array(reportTrendPointSchema).default([]),
  budgetSummary: reportBudgetSummarySchema,
  goalSummary: reportGoalSummarySchema,
  transactionSummary: reportTransactionSummarySchema,
  narrative: z.string(),
});

export const reportHistoryRecordSchema = z.object({
  id: z.string().uuid(),
  generatedAt: dateTimeStringSchema,
  periodLabel: z.string().min(1),
  format: z.enum(["json", "csv", "pdf"]),
  source: z.enum(["openai", "fallback"]),
  response: monthlyReportResponseSchema,
});

export const reportWorkspaceStateSchema = z.object({
  current: reportHistoryRecordSchema.nullable(),
  history: z.array(reportHistoryRecordSchema),
  source: z.enum(["demo", "database"]),
});
