import { z } from "zod";

export const debtAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or less"),
  type: z
    .string()
    .trim()
    .min(1, "Type is required")
    .max(80, "Type must be 80 characters or less"),
});

export const createDebtAccountSchema = debtAccountInputSchema;

export const updateDebtAccountSchema = debtAccountInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteDebtAccountSchema = z.object({
  id: z.string().uuid(),
});
