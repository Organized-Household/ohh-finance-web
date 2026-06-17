import { monthParamSchema } from "@/lib/validation/month";

function toUtcMonthStart(year: number, zeroBasedMonth: number): Date {
  return new Date(Date.UTC(year, zeroBasedMonth, 1, 0, 0, 0, 0));
}

export function parseMonthParam(value?: string): Date {
  const parsed = monthParamSchema.parse((value ?? "").trim());
  const [yearString, monthString] = parsed.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  return toUtcMonthStart(year, monthIndex);
}

export function getCurrentMonthStart(): Date {
  // OHHFIN-164: read the LOCAL year/month — getUTC* shifts users behind UTC
  // into the wrong month near boundaries (e.g. May 31 11pm UTC-5 → June).
  // The result is still normalized to a UTC month-start Date for consumers.
  const now = new Date();
  return toUtcMonthStart(now.getFullYear(), now.getMonth());
}

export function getNextMonthStart(monthStart: Date): Date {
  return toUtcMonthStart(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1);
}

export function serializeMonthParam(monthStart: Date): string {
  const year = monthStart.getUTCFullYear();
  const month = String(monthStart.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthStartDate(monthStart: Date): string {
  return monthStart.toISOString().slice(0, 10);
}

export function getMonthStart(input: string): string {
  return formatMonthStartDate(parseMonthParam(input));
}

export function isHistoricalMonth(
  selectedMonthStart: Date,
  currentMonthStart: Date = getCurrentMonthStart()
): boolean {
  return selectedMonthStart.getTime() < currentMonthStart.getTime();
}

// OHHFIN-164: local-timezone date helpers. transactions.transaction_date is a
// DATE column, so calendar dates must come from local accessors — never
// toISOString(), which converts to UTC and can shift the date.
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}
