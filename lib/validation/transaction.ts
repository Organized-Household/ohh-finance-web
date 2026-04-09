import { z } from "zod";

const transactionBaseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  amount: z
    .number()
    .positive("Amount must be greater than 0"),
  transaction_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  category_id: z.string().uuid(),
});

export const transactionSchema = transactionBaseSchema;

export const updateTransactionSchema = transactionBaseSchema.extend({
  id: z.string().uuid(),
});

export const deleteTransactionSchema = z.object({
  id: z.string().uuid(),
});
