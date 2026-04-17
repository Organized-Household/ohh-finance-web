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

function formatRate(rate: number | null): string | null {
  if (rate === null || rate === undefined) return null
  return `${(rate * 100).toFixed(2)}% p.a.`
}

const kindConfig = {
  savings: {
    label: 'Savings',
    labelColor: 'text-emerald-700',
    headerBg: 'bg-emerald-50',
    headerBorder: 'border-emerald-200',
  },
  investment: {
    label: 'Investments',
    labelColor: 'text-indigo-700',
    headerBg: 'bg-indigo-50',
    headerBorder: 'border-indigo-200',
  },
  debt: {
    label: 'Debts',
    labelColor: 'text-rose-700',
    headerBg: 'bg-rose-50',
    headerBorder: 'border-rose-200',
  },
  credit_card: {
    label: 'Credit Cards',
    labelColor: 'text-purple-700',
    headerBg: 'bg-purple-50',
    headerBorder: 'border-purple-200',
  },
} as const

export default function AccountTile({ kind, accounts }: AccountTileProps) {
  const config = kindConfig[kind]

  const isCreditCard = kind === 'credit_card'
  const isDebt = kind === 'debt'

  // Compute totals
  const totals = accounts.reduce(
    (acc, a) => {
      acc.balance += a.opening_balance ?? 0
      if (isCreditCard) {
        acc.charged += a.charged_this_month ?? 0
        acc.payment += a.payment_this_month ?? 0
      } else if (isDebt) {
        acc.in += a.in_this_month
        acc.paid += a.paid_this_month ?? 0
      } else {
        acc.in += a.in_this_month
        acc.out += a.out_this_month
      }
      return acc
    },
    { balance: 0, in: 0, out: 0, paid: 0, charged: 0, payment: 0 }
  )

  const hasBalance = accounts.some((a) => a.opening_balance !== null)

  return (
    <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
      {/* Header */}
      <div
        className={`border-b ${config.headerBorder} ${config.headerBg} px-3 py-2`}
      >
        <h3
          className={`text-xs font-semibold uppercase tracking-wide ${config.labelColor}`}
        >
          {config.label}
        </h3>
      </div>

      {accounts.length === 0 ? (
        <p className="px-3 py-4 text-xs text-slate-500">No {config.label.toLowerCase()} accounts.</p>
      ) : (
        <>
          {/* Column headers */}
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="grid text-[10px] font-semibold uppercase tracking-wide text-slate-500"
              style={{ gridTemplateColumns: hasBalance ? '1fr 6rem 6rem 6rem' : '1fr 6rem 6rem' }}
            >
              <span>Account</span>
              {hasBalance && <span className="text-right">Balance</span>}
              {isCreditCard ? (
                <>
                  <span className="text-right">Charged</span>
                  <span className="text-right">Paid</span>
                </>
              ) : isDebt ? (
                <>
                  <span className="text-right">In</span>
                  <span className="text-right">Paid</span>
                </>
              ) : (
                <>
                  <span className="text-right">In</span>
                  <span className="text-right">Out</span>
                </>
              )}
            </div>
          </div>

          {/* Account rows */}
          {accounts.map((account) => {
            const rate = formatRate(account.interest_rate)
            return (
              <div
                key={account.id}
                className="border-b border-slate-100 px-3 py-2"
              >
                <div
                  className="grid items-start text-sm"
                  style={{ gridTemplateColumns: hasBalance ? '1fr 6rem 6rem 6rem' : '1fr 6rem 6rem' }}
                >
                  <span className="text-slate-700 font-medium leading-tight">
                    {account.name}
                    {rate && (
                      <span className="ml-1 text-[10px] font-normal text-slate-400">
                        {rate}
                      </span>
                    )}
                  </span>
                  {hasBalance && (
                    <span className="text-right tabular-nums text-slate-600">
                      {account.opening_balance !== null
                        ? formatCurrency(account.opening_balance)
                        : '—'}
                    </span>
                  )}
                  {isCreditCard ? (
                    <>
                      <span className="text-right tabular-nums text-rose-600">
                        {formatCurrency(account.charged_this_month ?? 0)}
                      </span>
                      <span className="text-right tabular-nums text-emerald-600">
                        {formatCurrency(account.payment_this_month ?? 0)}
                      </span>
                    </>
                  ) : isDebt ? (
                    <>
                      <span className="text-right tabular-nums text-emerald-600">
                        {formatCurrency(account.in_this_month)}
                      </span>
                      <span className="text-right tabular-nums text-slate-600">
                        {formatCurrency(account.paid_this_month ?? 0)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-right tabular-nums text-emerald-600">
                        {formatCurrency(account.in_this_month)}
                      </span>
                      <span className="text-right tabular-nums text-slate-600">
                        {formatCurrency(account.out_this_month)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {/* Totals row */}
          <div className="bg-slate-50 px-3 py-2">
            <div
              className="grid text-xs font-semibold"
              style={{ gridTemplateColumns: hasBalance ? '1fr 6rem 6rem 6rem' : '1fr 6rem 6rem' }}
            >
              <span className="uppercase tracking-wide text-slate-600">Total</span>
              {hasBalance && (
                <span className="text-right tabular-nums text-slate-800">
                  {formatCurrency(totals.balance)}
                </span>
              )}
              {isCreditCard ? (
                <>
                  <span className="text-right tabular-nums text-rose-700">
                    {formatCurrency(totals.charged)}
                  </span>
                  <span className="text-right tabular-nums text-emerald-700">
                    {formatCurrency(totals.payment)}
                  </span>
                </>
              ) : isDebt ? (
                <>
                  <span className="text-right tabular-nums text-emerald-700">
                    {formatCurrency(totals.in)}
                  </span>
                  <span className="text-right tabular-nums text-slate-700">
                    {formatCurrency(totals.paid)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-right tabular-nums text-emerald-700">
                    {formatCurrency(totals.in)}
                  </span>
                  <span className="text-right tabular-nums text-slate-700">
                    {formatCurrency(totals.out)}
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
