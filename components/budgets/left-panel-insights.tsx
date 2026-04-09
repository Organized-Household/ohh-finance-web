import DistributionPercentList from "@/components/budgets/distribution-percent-list";
import DistributionBarChart from "@/components/budgets/distribution-bar-chart";
import IncomeDistributionList from "@/components/budgets/income-distribution-list";
import type { BudgetMetrics } from "@/components/budgets/budget-metrics";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";

type BuildBudgetLeftPanelSectionsParams = {
  metrics: BudgetMetrics;
};

export function buildBudgetLeftPanelSections({
  metrics,
}: BuildBudgetLeftPanelSectionsParams): WorkspaceLeftPanelSection[] {
  return [
    {
      title: "Household Member",
      content: (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
          Member selector placeholder. Shared member switching logic will be
          added in a future phase.
        </div>
      ),
    },
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
