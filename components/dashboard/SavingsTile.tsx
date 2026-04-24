import AccountTile from '@/components/dashboard/AccountTile'
import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface SavingsTileProps {
  accounts: DashboardAccount[]
}

/**
 * Pure-CSS height lock: the parent grid uses alignItems:'stretch', which forces
 * this cell to the same height as BVA (the tallest sibling). AccountTile with
 * fillHeight then fills that cell via height:100%, and its scroll body uses
 * flex:1 + minHeight:0 to overflow-y:auto within the available space.
 *
 * Zero JavaScript. Zero observers. Zero timers.
 */
export default function SavingsTile({ accounts }: SavingsTileProps) {
  return <AccountTile kind="savings" accounts={accounts} fillHeight />
}
