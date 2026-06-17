"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DashboardMonthSelectorProps = {
  selectedMonth: string;
};

export default function DashboardMonthSelector({
  selectedMonth,
}: DashboardMonthSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleMonthChange(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      id="dashboard-month"
      name="month"
      type="month"
      value={selectedMonth}
      onChange={(event) => handleMonthChange(event.target.value)}
      className="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
    />
  );
}