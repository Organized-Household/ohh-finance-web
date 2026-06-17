import { z } from "zod";

function normalizeAccountDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalDecimal(value: string | null | undefined): number | null | typeof Number.NaN {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

// --- Shared optional numeric fields ---

const openingBalanceField = z
  .string()
  .optional()
  .transform((value) => parseOptionalDecimal(value))
  .refine(
    (value) => value === null || (Number.isFinite(value) && (value as number) >= 0),
    "Balance must be a number greater than or equal to 0"
  );

// User enters percent (e.g. 4.89); stored as decimal (0.0489)
const interestRateField = z
  .string()
  .optional()
  .transform((value) => {
    const n = parseOptionalDecimal(value);
    if (n === null) return null;
    if (!Number.isFinite(n)) return Number.NaN;
    return (n as number) / 100;
  })
  .refine(
    (value) => value === null || (Number.isFinite(value) && (value as number) >= 0 && (value as number) <= 1),
    "Interest rate must be between 0 and 100"
  );

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
  opening_balance: openingBalanceField,
  interest_rate: interestRateField,
  target_amount: z
    .string()
    .optional()
    .transform((value) => parseOptionalDecimal(value))
    .refine(
      (value) => value === null || (Number.isFinite(value) && (value as number) >= 0),
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

const investmentSubtypeValues = [
  "rrsp", "tfsa", "resp", "stocks", "etf", "gic", "pension", "gsop", "rpp", "other",
] as const;

const targetAmountField = z
  .string()
  .optional()
  .transform((value) => parseOptionalDecimal(value))
  .refine(
    (value) => value === null || (Number.isFinite(value) && (value as number) >= 0),
    "Target amount must be a number greater than or equal to 0"
  );

const targetDateField = z
  .string()
  .optional()
  .transform((value) => normalizeOptionalText(value))
  .refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Target date is invalid"
  );

export const investmentAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or less"),
  account_subtype: z.enum(investmentSubtypeValues, {
    error: "Please select a valid investment type",
  }),
  opening_balance: openingBalanceField,
  interest_rate: interestRateField,
  target_amount: targetAmountField,
  target_date: targetDateField,
});

export const createInvestmentAccountSchema = investmentAccountInputSchema;

export const updateInvestmentAccountSchema = investmentAccountInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteInvestmentAccountSchema = z.object({
  id: z.string().uuid(),
});

// --- Debt ---

const debtSubtypeValues = [
  "credit_card", "mortgage", "heloc", "car_loan", "personal_loan", "other",
] as const;

export const debtAccountInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or less"),
  account_subtype: z.enum(debtSubtypeValues, {
    error: "Please select a valid debt type",
  }),
  opening_balance: openingBalanceField,
  interest_rate: interestRateField,
  target_amount: targetAmountField,
  target_date: targetDateField,
});

export const createDebtAccountSchema = debtAccountInputSchema;

export const updateDebtAccountSchema = debtAccountInputSchema.extend({
  id: z.string().uuid(),
});

export const deleteDebtAccountSchema = z.object({
  id: z.string().uuid(),
});
