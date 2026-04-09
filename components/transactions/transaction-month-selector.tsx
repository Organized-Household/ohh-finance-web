"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type TransactionMonthSelectorProps = {
  selectedMonth: string;
  options: string[];
};

export default function TransactionMonthSelector({
  selectedMonth,
  options,
}: TransactionMonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleMonthChange(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2">
      <label
        htmlFor="month"
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      >
        Month
      </label>
      <select
        id="month"
        name="month"
        value={selectedMonth}
        onChange={(event) => handleMonthChange(event.target.value)}
        className="mt-1 block w-36 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
