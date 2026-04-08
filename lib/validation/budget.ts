import { z } from "zod";

export const budgetLineSchema = z.object({
  category_id: z.string().uuid(),
  amount: z.number().min(0),
});

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  lines: z.array(budgetLineSchema),
});