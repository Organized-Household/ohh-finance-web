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

// Decision Log: "Current Balance" for savings/investments, "Balance Owed" for debts/credit cards
const kindConfig = {
  savings: {
    label:        'Savings',
    titleBg:      '#d1fae5',
    titleBorder:  '#a7f3d0',
    titleColor:   '#065f46',
    balanceLabel: 'Current Balance',
    col2Label:    'In',
    col3Label:    'Out',
  },
  investment: {
    label:        'Investments',
    titleBg:      '#dbeafe',
    titleBorder:  '#bfdbfe',
    titleColor:   '#1e40af',
    balanceLabel: 'Current Balance',
    col2Label:    'In',
    col3Label:    'Out',
  },
  debt: {
    label:        'Debts',
    titleBg:      '#fee2e2',
    titleBorder:  '#fecaca',
    titleColor:   '#991b1b',
    balanceLabel: 'Balance Owed',
    col2Label:    'Paid',   // linked_account_id — money reducing the balance
    col3Label:    'Spent',  // payment_source_account_id — charges via the account
  },
  credit_card: {
    label:        'Credit Cards',
    titleBg:      '#ede9fe',
    titleBorder:  '#ddd6fe',
    titleColor:   '#5b21b6',
    balanceLabel: 'Balance Owed',
    col2Label:    'Payment',  // linked_account_id — paying down the card
    col3Label:    'Charged',  // payment_source_account_id — expenses on the card
  },
} as const

// Grid: account-name (flex-1) | balance (80px) | col2 (65px) | col3 (65px)
const GRID_COLS = '1fr 80px 65px 65px'

// Column header row style — light grey, bold 9px dark text (same as BVA)
const colHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  background: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
  padding: '4px 12px',
  fontSize: 10,
  fontWeight: 700,
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export default function AccountTile({ kind, accounts }: AccountTileProps) {
  const config = kindConfig[kind]
  const isCreditCard = kind === 'credit_card'
  const isDebt = kind === 'debt'

  function accountCol2(a: DashboardAccount): number {
    if (isCreditCard) return a.payment_this_month ?? 0  // Payment (paying down card)
    if (isDebt)       return a.paid_this_month ?? 0     // Paid (reducing debt balance)
    return a.in_this_month
  }
  function accountCol3(a: DashboardAccount): number {
    if (isCreditCard) return a.charged_this_month ?? 0  // Charged (spending on card)
    if (isDebt)       return a.in_this_month            // Spent (charges via debt account)
    return a.out_this_month
  }

  const totals = accounts.reduce(
    (acc, a) => {
      acc.balance += a.opening_balance ?? 0
      acc.col2    += accountCol2(a)
      acc.col3    += accountCol3(a)
      return acc
    },
    { balance: 0, col2: 0, col3: 0 }
  )

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      {/* Pastel title bar */}
      <div style={{
        background:   config.titleBg,
        borderBottom: `1px solid ${config.titleBorder}`,
        padding:      '6px 12px',
      }}>
        <h3 style={{
          fontSize:      10,
          fontWeight:    600,
          color:         config.titleColor,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin:        0,
        }}>
          {config.label}
        </h3>
      </div>

      {accounts.length === 0 ? (
        <p className="px-3 py-3 text-[11px] text-slate-500">
          No {config.label.toLowerCase()} accounts.
        </p>
      ) : (
        <>
          {/* Column header row */}
          <div style={colHeaderStyle}>
            <span>Account</span>
            <span style={{ textAlign: 'right' }}>{config.balanceLabel}</span>
            <span style={{ textAlign: 'right' }}>{config.col2Label}</span>
            <span style={{ textAlign: 'right' }}>{config.col3Label}</span>
          </div>

          {/* Account rows */}
          {accounts.map((account) => {
            const rate = formatRate(account.interest_rate)
            return (
              <div key={account.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '5px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'baseline', fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: '#374151', lineHeight: 1.3 }}>
                    {account.name}
                    {rate && (
                      <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>
                        {rate}
                      </span>
                    )}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                    {account.opening_balance != null ? formatCurrency(account.opening_balance) : '—'}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                    {formatCurrency(accountCol2(account))}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                    {formatCurrency(accountCol3(account))}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Totals row */}
          <div style={{ background: '#f8fafc', padding: '5px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Total
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1e293b' }}>
                {formatCurrency(totals.balance)}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                {formatCurrency(totals.col2)}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#374151' }}>
                {formatCurrency(totals.col3)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
