import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface CombinedDebtsTileProps {
  debtAccounts: DashboardAccount[]
  creditCardAccounts: DashboardAccount[]
}

interface DebtRow {
  id: string
  name: string
  opening_balance: number | null
  paid: number
  spent: number
  is_credit_card: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Grid: account-name (flex-1) | balance (90px) | paid (70px) | spent (70px)
const GRID_COLS = '1fr 90px 70px 70px'

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
  flexShrink: 0,
}

export default function CombinedDebtsTile({
  debtAccounts,
  creditCardAccounts,
}: CombinedDebtsTileProps) {
  // Map debt accounts
  const debtRows: DebtRow[] = debtAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    opening_balance: a.opening_balance,
    paid: a.paid_this_month ?? 0,
    spent: a.paid_this_month ?? 0,
    is_credit_card: false,
  }))

  // Map credit card accounts
  const ccRows: DebtRow[] = creditCardAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    opening_balance: a.opening_balance,
    paid: a.payment_this_month ?? 0,
    spent: a.charged_this_month ?? 0,
    is_credit_card: true,
  }))

  const allRows = [...debtRows, ...ccRows]

  const totalBalance = allRows.reduce((s, r) => s + (r.opening_balance ?? 0), 0)
  const totalPaid    = allRows.reduce((s, r) => s + r.paid, 0)
  const totalSpent   = allRows.reduce((s, r) => s + r.spent, 0)

  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-300 bg-white"
      style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px' }}
    >
      {/* Pastel red title bar */}
      <div style={{
        background:   '#fee2e2',
        borderBottom: '1px solid #fecaca',
        padding:      '6px 12px',
        flexShrink:   0,
      }}>
        <h3 style={{
          fontSize:      10,
          fontWeight:    600,
          color:         '#991b1b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin:        0,
        }}>
          Debts
        </h3>
      </div>

      {/* Column header */}
      <div style={colHeaderStyle}>
        <span>Account</span>
        <span style={{ textAlign: 'right' }}>Balance Owed</span>
        <span style={{ textAlign: 'right' }}>Paid</span>
        <span style={{ textAlign: 'right' }}>Spent</span>
      </div>

      {/* Scrollable body — max 5 rows visible */}
      <div
        className="bva-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {allRows.length === 0 && (
          <div style={{
            padding: '16px 12px',
            textAlign: 'center',
            fontSize: 12,
            color: '#64748b',
          }}>
            No debt accounts.
          </div>
        )}

        {/* Non-CC debt rows */}
        {debtRows.map((row) => (
          <div key={row.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '5px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'baseline', fontSize: 13 }}>
              <span style={{ fontWeight: 500, color: '#374151' }}>{row.name}</span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                {row.opening_balance != null ? formatCurrency(row.opening_balance) : '—'}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                {formatCurrency(row.paid)}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                {formatCurrency(row.spent)}
              </span>
            </div>
          </div>
        ))}

        {/* Credit Cards sub-section divider */}
        {ccRows.length > 0 && (
          <div style={{
            padding:       '4px 12px',
            fontSize:      9,
            fontWeight:    600,
            color:         '#64748b',
            background:    '#f8fafc',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderTop:     '0.5px solid #e2e8f0',
          }}>
            Credit Cards
          </div>
        )}

        {/* CC rows */}
        {ccRows.map((row) => (
          <div key={row.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '5px 12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'baseline', fontSize: 13 }}>
              <span style={{ fontWeight: 500, color: '#374151' }}>{row.name}</span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                {row.opening_balance != null ? formatCurrency(row.opening_balance) : '—'}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                {formatCurrency(row.paid)}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                {formatCurrency(row.spent)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pinned totals footer */}
      <div style={{ background: '#f8fafc', padding: '5px 12px', flexShrink: 0, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, fontSize: 13, fontWeight: 600 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
            Total
          </span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1e293b' }}>
            {formatCurrency(totalBalance)}
          </span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
            {formatCurrency(totalPaid)}
          </span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#374151' }}>
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>
    </div>
  )
}
