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
  linked_account_id: optionalUuidSchema,
  payment_source_account_id: optionalUuidSchema,
}).superRefine((data, ctx) => {
  if (
    data.linked_account_id &&
    data.payment_source_account_id &&
    data.linked_account_id === data.payment_source_account_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Linked account and payment source cannot be the same account",
      path: ["payment_source_account_id"],
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
