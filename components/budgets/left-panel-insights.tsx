import DistributionPercentList from "@/components/budgets/distribution-percent-list";
import DistributionBarChart from "@/components/budgets/distribution-bar-chart";
import IncomeDistributionList from "@/components/budgets/income-distribution-list";
import HouseholdMemberCard from "@/components/layout/household-member-card";
import type { BudgetMetrics } from "@/components/budgets/budget-metrics";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";

type BuildBudgetLeftPanelSectionsParams = {
  metrics: BudgetMetrics;
  memberFirstName: string;
};

export function buildBudgetLeftPanelSections({
  metrics,
  memberFirstName,
}: BuildBudgetLeftPanelSectionsParams): WorkspaceLeftPanelSection[] {
  return [
    {
      title: "Household Member",
      content: <HouseholdMemberCard firstName={memberFirstName} />,
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
