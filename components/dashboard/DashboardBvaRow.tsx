'use client'

import BudgetVsActualTable from '@/components/dashboard/BudgetVsActualTable'
import AccountTile from '@/components/dashboard/AccountTile'
import type { BudgetVsActualRpcRow, DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface DashboardBvaRowProps {
  bvaRows: BudgetVsActualRpcRow[]
  savingsAccounts: DashboardAccount[]
  investmentAccounts: DashboardAccount[]
  /** A = days elapsed ÷ days in month; passed to BVA for pace-based badges */
  monthProgress: number
}

export default function DashboardBvaRow({
  bvaRows,
  savingsAccounts,
  investmentAccounts,
  monthProgress,
}: DashboardBvaRowProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '10px', alignItems: 'start' }}>
      {/* BVA table — 3fr: maxHeight set dynamically to match right column */}
      <BudgetVsActualTable
        rows={bvaRows}
        monthProgress={monthProgress}
      />

      {/* Right column — 2fr: Savings + Investments stacked; id used by BVA to measure height */}
      <div
        id="bva-right-col-anchor"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <AccountTile kind="savings" accounts={savingsAccounts} />
        <AccountTile kind="investment" accounts={investmentAccounts} />
      </div>
    </div>
  )
}
