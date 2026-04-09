import { z } from "zod";

export const transactionSchema = z.object({
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
