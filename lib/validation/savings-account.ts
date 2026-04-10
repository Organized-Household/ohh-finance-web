import { z } from "zod";

function normalizeAccountDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export const savingsAccountInputSchema = z.object({
  purpose: z
    .string()
    .trim()
    .min(1, "Purpose is required")
    .max(120, "Purpose must be 120 characters or less"),
  account_number: z
    .string()
    .optional()
    .transform((value) => normalizeAccountDigits(value ?? ""))
    .refine(
      (digits) => digits.length === 0 || (digits.length >= 4 && digits.length <= 34),
      "Account number must be between 4 and 34 digits"
    ),
});

export const createSavingsAccountSchema = savingsAccountInputSchema;

export const updateSavingsAccountSchema = savingsAccountInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteSavingsAccountSchema = z.object({
  id: z.string().uuid(),
});

export function toAccountNumberLast4(accountNumberDigits: string): string | null {
  if (!accountNumberDigits) {
    return null;
  }

  return accountNumberDigits.slice(-4);
}
