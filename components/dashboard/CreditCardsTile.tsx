import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface CreditCardsTileProps {
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

// Grid: account-name (flex-1) | balance owed (90px) | payment (70px) | charged (70px)
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

export default function CreditCardsTile({ accounts }: CreditCardsTileProps) {
  const totalBalance = accounts.reduce((s, a) => s + (a.opening_balance ?? 0), 0)
  const totalPayment = accounts.reduce((s, a) => s + (a.payment_this_month ?? 0), 0)
  const totalCharged = accounts.reduce((s, a) => s + (a.charged_this_month ?? 0), 0)

  return (
    <div
      className="overflow-hidden rounded-lg border border-slate-300 bg-white"
      style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px' }}
    >
      {/* Pastel purple title bar */}
      <div style={{
        background:   '#ede9fe',
        borderBottom: '1px solid #ddd6fe',
        padding:      '6px 12px',
        flexShrink:   0,
      }}>
        <h3 style={{
          fontSize:      10,
          fontWeight:    600,
          color:         '#5b21b6',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin:        0,
        }}>
          Credit Cards
        </h3>
      </div>

      {accounts.length === 0 ? (
        <p style={{ padding: '12px', fontSize: 11, color: '#64748b', margin: 0 }}>
          No credit card accounts.
        </p>
      ) : (
        <>
          {/* Column header */}
          <div style={colHeaderStyle}>
            <span>Account</span>
            <span style={{ textAlign: 'right' }}>Balance Owed</span>
            <span style={{ textAlign: 'right' }}>Payment</span>
            <span style={{ textAlign: 'right' }}>Charged</span>
          </div>

          {/* Scrollable body */}
          <div
            className="bva-scroll"
            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
          >
            {accounts.map((account) => (
              <div key={account.id} style={{ borderBottom: '1px solid #f1f5f9', padding: '5px 12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'baseline', fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: '#374151' }}>{account.name}</span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                    {account.opening_balance != null ? formatCurrency(account.opening_balance) : '—'}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669' }}>
                    {formatCurrency(account.payment_this_month ?? 0)}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#4b5563' }}>
                    {formatCurrency(account.charged_this_month ?? 0)}
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
                {formatCurrency(totalPayment)}
              </span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#374151' }}>
                {formatCurrency(totalCharged)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
