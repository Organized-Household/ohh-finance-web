const incomeColors = [
  "#10b981",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#14b8a6",
];

export function getIncomeColor(index: number): string {
  return incomeColors[index % incomeColors.length];
}
