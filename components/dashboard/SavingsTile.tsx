import AccountTile from '@/components/dashboard/AccountTile'
import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface SavingsTileProps {
  accounts: DashboardAccount[]
}

// fillHeight → AccountTile outer div gets height:'100%', filling the CSS grid cell.
// The grid cell height comes from the flex:1 row container in the page layout.
// No JavaScript, no measurement — pure CSS.
export default function SavingsTile({ accounts }: SavingsTileProps) {
  return <AccountTile kind="savings" accounts={accounts} fillHeight />
}
