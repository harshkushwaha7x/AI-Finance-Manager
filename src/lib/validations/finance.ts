import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

const dateTimeStringSchema = z.string().min(1, "A date and time is required.");
const optionalShortTextSchema = z.string().max(120).optional().or(z.literal(""));
const optionalLongTextSchema = z.string().max(500).optional().or(z.literal(""));

const currencyCodeSchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter currency code.")
  .transform((value) => value.toUpperCase());

const moneySchema = z.coerce.number().nonnegative("Amount must be zero or greater.");

export const transactionInputSchema = z.object({
  businessProfileId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
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
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
});

export const transactionSummarySchema = z.object({
  incomeTotal: moneySchema,
  expenseTotal: moneySchema,
  reviewCount: z.coerce.number().int().min(0),
  recurringCount: z.coerce.number().int().min(0),
  netCashflow: z.coerce.number(),
});

export const transactionWorkspaceStateSchema = z.object({
  transactions: z.array(transactionRecordSchema),
  categories: z.array(transactionCategoryOptionSchema),
  summary: transactionSummarySchema,
  source: z.enum(["demo", "database"]),
});

export const budgetInputSchema = z.object({
  businessProfileId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  name: z.string().min(2, "Budget name is required."),
  limitAmount: moneySchema,
  period: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  alertPercent: z.coerce.number().int().min(1).max(100).default(80),
  carryForward: z.boolean().default(false),
});

export const goalInputSchema = z.object({
  title: z.string().min(2, "Goal title is required."),
  description: optionalLongTextSchema,
  targetAmount: moneySchema,
  currentAmount: moneySchema.default(0),
  targetDate: dateStringSchema.optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  icon: z.string().max(60).optional().or(z.literal("")),
});

export const documentUploadResultSchema = z.object({
  documentId: z.string().uuid(),
  storagePath: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.coerce.number().int().positive(),
  kind: z.enum(["receipt", "invoice", "bill", "tax_doc", "other"]),
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

export const insightResponseSchema = z.object({
  summary: z.string(),
  anomalies: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        estimatedSavings: moneySchema,
        priority: z.enum(["low", "medium", "high"]),
      }),
    )
    .default([]),
});

export const invoiceItemInputSchema = z.object({
  description: z.string().min(2, "Description is required."),
  quantity: z.coerce.number().positive(),
  unitPrice: moneySchema,
  gstRate: z.coerce.number().min(0).max(100).default(18),
});

export const invoiceInputSchema = z.object({
  businessProfileId: z.string().uuid(),
  invoiceNumber: z.string().min(2, "Invoice number is required."),
  customerName: z.string().min(2, "Customer name is required."),
  customerEmail: z.email("Enter a valid customer email.").optional().or(z.literal("")),
  customerGstin: z.string().max(30).optional().or(z.literal("")),
  issueDate: dateStringSchema,
  dueDate: dateStringSchema.optional(),
  currency: currencyCodeSchema.default("INR"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  notes: optionalLongTextSchema,
  items: z.array(invoiceItemInputSchema).min(1, "Add at least one invoice item."),
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
    savings: moneySchema,
  }),
  highlights: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
  narrative: z.string(),
});
