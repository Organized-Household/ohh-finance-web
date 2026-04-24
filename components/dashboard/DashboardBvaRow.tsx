'use client'

import BudgetVsActualTable from '@/components/dashboard/BudgetVsActualTable'
import SavingsTile from '@/components/dashboard/SavingsTile'
import type { BudgetVsActualRpcRow, DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface DashboardBvaRowProps {
  bvaRows: BudgetVsActualRpcRow[]
  savingsAccounts: DashboardAccount[]
  /** A = days elapsed ÷ days in month; passed to BVA for pace-based badges */
  monthProgress: number
}

export default function DashboardBvaRow({
  bvaRows,
  savingsAccounts,
  monthProgress,
}: DashboardBvaRowProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '10px', alignItems: 'start' }}>
      {/* BVA — 3fr; JS reads dashboard-right-col height and sets maxHeight */}
      <BudgetVsActualTable
        rows={bvaRows}
        monthProgress={monthProgress}
      />

      {/* Savings — 2fr; id="dashboard-right-col" so BVA can measure natural height */}
      <div id="dashboard-right-col">
        <SavingsTile accounts={savingsAccounts} />
      </div>
    </div>
  )
}
