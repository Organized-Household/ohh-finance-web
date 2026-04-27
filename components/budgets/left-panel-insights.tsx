import DistributionPercentList from "@/components/budgets/distribution-percent-list";
import DistributionBarChart from "@/components/budgets/distribution-bar-chart";
import IncomeDistributionList from "@/components/budgets/income-distribution-list";
import type { BudgetMetrics } from "@/components/budgets/budget-metrics";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";

type BuildBudgetMetricsSectionsParams = {
  metrics: BudgetMetrics;
};

// Returns the 3 metrics sections only — callers prepend their own first section
// (member selector for budget page, household info card for categories page).
export function buildBudgetMetricsSections({
  metrics,
}: BuildBudgetMetricsSectionsParams): WorkspaceLeftPanelSection[] {
  return [
    {
      title: "Budget Distribution",
      content: <DistributionPercentList metrics={metrics} />,
    },
    {
      title: "Income Distribution",
      content: <IncomeDistributionList metrics={metrics} />,
    },
    {
      title: "Distribution Chart",
      content: <DistributionBarChart metrics={metrics} />,
    },
  ];
}

// Legacy alias — kept so any remaining callers don't break; wraps the new function.
// Deprecated: prefer building the first section in the caller and using buildBudgetMetricsSections.
export function buildBudgetLeftPanelSections(
  params: BuildBudgetMetricsSectionsParams
): WorkspaceLeftPanelSection[] {
  return buildBudgetMetricsSections(params);
}
