import {
  getCurrentMonthStart,
  getNextMonthStart,
  parseMonthParam,
  serializeMonthParam,
} from "@/lib/db/month";
import { monthParamSchema } from "@/lib/validation/month";

type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | undefined;

function getSearchMonth(searchParams: SearchParamsInput): string | undefined {
  const value = searchParams?.month;

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getDashboardMonth(searchParams: SearchParamsInput) {
  const monthValue = getSearchMonth(searchParams);
  const parsed = monthParamSchema.safeParse((monthValue ?? "").trim());
  const monthStart = parsed.success
    ? parseMonthParam(parsed.data)
    : getCurrentMonthStart();

  return {
    monthStart,
    nextMonthStart: getNextMonthStart(monthStart),
    monthParam: serializeMonthParam(monthStart),
  };
}