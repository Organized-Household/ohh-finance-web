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
  payment_savings_account_id: optionalUuidSchema,
  payment_investment_account_id: optionalUuidSchema,
  payment_debt_account_id: optionalUuidSchema,
}).superRefine((value, ctx) => {
  const populatedDestinationLinkCount = [
    value.savings_account_id,
    value.investment_account_id,
    value.debt_account_id,
  ].filter((entry) => entry !== null).length;

  if (populatedDestinationLinkCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["savings_account_id"],
      message: "Only one linked account may be selected.",
    });
  }

  const populatedPaymentSourceCount = [
    value.payment_savings_account_id,
    value.payment_investment_account_id,
    value.payment_debt_account_id,
  ].filter((entry) => entry !== null).length;

  if (populatedPaymentSourceCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_savings_account_id"],
      message: "Only one payment source account may be selected.",
    });
  }

  if (
    value.savings_account_id &&
    value.payment_savings_account_id &&
    value.savings_account_id === value.payment_savings_account_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_savings_account_id"],
      message: "Payment source cannot be the same as the linked savings account.",
    });
  }

  if (
    value.investment_account_id &&
    value.payment_investment_account_id &&
    value.investment_account_id === value.payment_investment_account_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_investment_account_id"],
      message: "Payment source cannot be the same as the linked investment account.",
    });
  }

  if (
    value.debt_account_id &&
    value.payment_debt_account_id &&
    value.debt_account_id === value.payment_debt_account_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["payment_debt_account_id"],
      message: "Payment source cannot be the same as the linked debt account.",
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
