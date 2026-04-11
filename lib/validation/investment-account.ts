import { z } from "zod";

export const investmentAccountInputSchema = z.object({
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

export const createInvestmentAccountSchema = investmentAccountInputSchema;

export const updateInvestmentAccountSchema = investmentAccountInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteInvestmentAccountSchema = z.object({
  id: z.string().uuid(),
});
