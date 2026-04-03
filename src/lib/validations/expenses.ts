import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

const optionalShortTextSchema = z.string().max(120).optional().or(z.literal(""));
const optionalLongTextSchema = z.string().max(500).optional().or(z.literal(""));

export const expenseQuickAddSchema = z.object({
  title: z.string().min(2, "Title is required."),
  categoryId: z.string().uuid().optional(),
  amount: z.coerce.number().nonnegative("Amount must be zero or greater."),
  transactionDate: dateStringSchema,
  merchantName: optionalShortTextSchema,
  paymentMethod: optionalShortTextSchema,
  recurring: z.boolean().default(false),
  recurringInterval: z.string().max(60).optional().or(z.literal("")),
  notes: optionalLongTextSchema,
});
