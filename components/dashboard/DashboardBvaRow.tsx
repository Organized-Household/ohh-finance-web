'use client'

import { useRef } from 'react'
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
  const rightColRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex gap-2">
      {/* BVA table — 60% */}
      <div style={{ flex: 3, minWidth: 0 }}>
        <BudgetVsActualTable
          rows={bvaRows}
          rightColRef={rightColRef}
          monthProgress={monthProgress}
        />
      </div>

      {/* Right column — 40%: Savings + Investments stacked */}
      <div
        ref={rightColRef}
        style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <AccountTile kind="savings" accounts={savingsAccounts} />
        <AccountTile kind="investment" accounts={investmentAccounts} />
      </div>
    </div>
  )
}
