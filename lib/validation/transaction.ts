import { z } from "zod";

const optionalUuidSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return value;
}, z.string().uuid().nullable());

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
  savings_account_id: optionalUuidSchema,
  investment_account_id: optionalUuidSchema,
  debt_account_id: optionalUuidSchema,
}).superRefine((value, ctx) => {
  const populatedLinkCount = [
    value.savings_account_id,
    value.investment_account_id,
    value.debt_account_id,
  ].filter((entry) => entry !== null).length;

  if (populatedLinkCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["savings_account_id"],
      message: "Only one linked account may be selected.",
    });
  }
});

export const transactionSchema = transactionBaseSchema;

export const updateTransactionSchema = transactionBaseSchema.extend({
  id: z.string().uuid(),
});

export const deleteTransactionSchema = z.object({
  id: z.string().uuid(),
});
