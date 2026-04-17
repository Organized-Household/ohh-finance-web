import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface AccountTileProps {
  kind: 'savings' | 'investment' | 'debt' | 'credit_card'
  accounts: DashboardAccount[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatRate(rate: number | null | undefined): string | null {
  if (rate == null) return null
  return `${(rate * 100).toFixed(2)}% p.a.`
}

const kindConfig = {
  savings: {
    label: 'Savings',
    labelColor: 'text-emerald-700',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
    col2: 'In',
    col3: 'Out',
  },
  investment: {
    label: 'Investments',
    labelColor: 'text-indigo-700',
    headerBg: 'bg-indigo-50',
    headerBorder: 'border-indigo-200',
    col2: 'In',
    col3: 'Out',
  },
  debt: {
    label: 'Debts',
    labelColor: 'text-rose-700',
    headerBg: 'bg-rose-50',
    headerBorder: 'border-rose-200',
    col2: 'Paid',    // money paid INTO debt (reducing balance)
    col3: 'Spent',   // money spent VIA debt account (charges)
  },
  credit_card: {
    label: 'Credit Cards',
    labelColor: 'text-purple-700',
    headerBg: 'bg-purple-50',
    headerBorder: 'border-purple-200',
    col2: 'Charged',
    col3: 'Payment',
  },
} as const

// Grid: account-name (flex-1) | balance (90px) | col2 (70px) | col3 (70px)
const GRID_COLS = '1fr 90px 70px 70px'

export default function AccountTile({ kind, accounts }: AccountTileProps) {
  const config = kindConfig[kind]
  const isCreditCard = kind === 'credit_card'
  const isDebt = kind === 'debt'

  const totals = accounts.reduce(
    (acc, a) => {
      acc.balance += a.opening_balance ?? 0
      if (isCreditCard) {
        acc.col2 += a.charged_this_month ?? 0
        acc.col3 += a.payment_this_month ?? 0
      } else if (isDebt) {
        acc.col2 += a.paid_this_month ?? 0
        acc.col3 += a.in_this_month  // "Spent" = payment_source charges
      } else {
        acc.col2 += a.in_this_month
        acc.col3 += a.out_this_month
      }
      return acc
    },
    { balance: 0, col2: 0, col3: 0 }
  )

  function accountCol2(a: DashboardAccount): number {
    if (isCreditCard) return a.charged_this_month ?? 0
    if (isDebt) return a.paid_this_month ?? 0
    return a.in_this_month
  }
  function accountCol3(a: DashboardAccount): number {
    if (isCreditCard) return a.payment_this_month ?? 0
    if (isDebt) return a.in_this_month  // "Spent" uses in_this_month for debts
    return a.out_this_month
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      {/* Tile header */}
      <div className={`border-b ${config.headerBorder} ${config.headerBg} px-3 py-1.5`}>
        <h3 className={`text-[9px] font-semibold uppercase tracking-wide ${config.labelColor}`}>
          {config.label}
        </h3>
      </div>

      {accounts.length === 0 ? (
        <p className="px-3 py-3 text-[11px] text-slate-500">
          No {config.label.toLowerCase()} accounts.
        </p>
      ) : (
        <>
          {/* Column headers */}
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-1">
            <div
              className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
              style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
            >
              <span>Account</span>
              <span className="text-right">Balance</span>
              <span className="text-right">{config.col2}</span>
              <span className="text-right">{config.col3}</span>
            </div>
          </div>

          {/* Account rows */}
          {accounts.map((account) => {
            const rate = formatRate(account.interest_rate)
            return (
              <div key={account.id} className="border-b border-slate-100 px-3 py-1.5">
                <div
                  className="items-baseline text-[11px]"
                  style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
                >
                  <span className="font-medium leading-tight text-slate-700">
                    {account.name}
                    {rate && (
                      <span className="ml-1 text-[9px] font-normal text-slate-400">
                        {rate}
                      </span>
                    )}
                  </span>
                  <span className="text-right tabular-nums text-slate-600">
                    {account.opening_balance != null
                      ? formatCurrency(account.opening_balance)
                      : '—'}
                  </span>
                  <span className="text-right tabular-nums text-emerald-600">
                    {formatCurrency(accountCol2(account))}
                  </span>
                  <span className="text-right tabular-nums text-slate-600">
                    {formatCurrency(accountCol3(account))}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Totals row */}
          <div className="px-3 py-1.5">
            <div
              className="text-[11px] font-semibold"
              style={{ display: 'grid', gridTemplateColumns: GRID_COLS }}
            >
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Total</span>
              <span className="text-right tabular-nums text-slate-800">
                {formatCurrency(totals.balance)}
              </span>
              <span className="text-right tabular-nums text-emerald-700">
                {formatCurrency(totals.col2)}
              </span>
              <span className="text-right tabular-nums text-slate-700">
                {formatCurrency(totals.col3)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
