import { WorkspaceShell } from '@/components/layout/workspace-shell';
import { BudgetForm } from './budget-form';
import { getCurrentMonthStart } from '@/lib/db/month';

export default function BudgetsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const currentMonthStart = getCurrentMonthStart();
  const selectedMonth = searchParams.month || currentMonthStart;

  return (
    <WorkspaceShell>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Budget</h1>
        <BudgetForm selectedMonth={selectedMonth} currentMonthStart={currentMonthStart} />
      </div>
    </WorkspaceShell>
  );
}
