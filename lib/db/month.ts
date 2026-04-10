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
  const now = new Date();
  return toUtcMonthStart(now.getUTCFullYear(), now.getUTCMonth());
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
