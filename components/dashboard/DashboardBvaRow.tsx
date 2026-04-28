import BudgetVsActualTable from '@/components/dashboard/BudgetVsActualTable'
import SavingsTile from '@/components/dashboard/SavingsTile'
import type { BudgetVsActualRpcRow, DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface DashboardBvaRowProps {
  bvaRows: BudgetVsActualRpcRow[]
  savingsAccounts: DashboardAccount[]
  /** A = days elapsed ÷ days in month; passed to BVA for pace-based badges */
  monthProgress: number
}

// flex:1 + minHeight:0 on the root div means this row takes ALL remaining height
// in the page's flex-column layout after Rows 1, 2, and 4 claim their fixed space.
// The inner grid distributes that height between BVA (3fr) and Savings (2fr).
// Both children use height:100% to fill their grid cells.
export default function DashboardBvaRow({
  bvaRows,
  savingsAccounts,
  monthProgress,
}: DashboardBvaRowProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]"
      style={{ flex: 1, minHeight: 0 }}
    >
      <BudgetVsActualTable rows={bvaRows} monthProgress={monthProgress} />
      <SavingsTile accounts={savingsAccounts} />
    </div>
  )
}
