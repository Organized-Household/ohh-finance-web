import { z } from "zod";

function normalizeAccountDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

// --- Savings ---

export const savingsAccountInputSchema = z.object({
  name: z
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
  target_amount: z
    .string()
    .optional()
    .transform((value) => {
      const normalized = normalizeOptionalText(value);
      if (!normalized) {
        return null;
      }
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine(
      (value) => value === null || (Number.isFinite(value) && value >= 0),
      "Target amount must be a number greater than or equal to 0"
    ),
  target_date: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value))
    .refine(
      (value) => value === null || !Number.isNaN(Date.parse(value)),
      "Target date is invalid"
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

// --- Investment ---

export const investmentAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or less"),
  account_subtype: z
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

// --- Debt ---

export const debtAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or less"),
  account_subtype: z
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
