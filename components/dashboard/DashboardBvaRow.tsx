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
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '10px', alignItems: 'stretch' }}>
      {/* BVA — 3fr; maxHeight:calc(100vh-320px) caps its height; body scrolls inside */}
      <BudgetVsActualTable
        rows={bvaRows}
        monthProgress={monthProgress}
      />

      {/* Savings — 2fr; alignItems:stretch forces this cell to BVA height; height:100% fills it */}
      <SavingsTile accounts={savingsAccounts} />
    </div>
  )
}
