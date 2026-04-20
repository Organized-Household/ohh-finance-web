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
      {/* BVA table — 3fr; id="bva-card-anchor" is on the card itself so SavingsTile can measure it */}
      <BudgetVsActualTable
        rows={bvaRows}
        monthProgress={monthProgress}
      />

      {/* Savings tile — 2fr; height-locks itself to BVA via getElementById */}
      <SavingsTile accounts={savingsAccounts} />
    </div>
  )
}
