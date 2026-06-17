import { Fragment } from 'react'
import type { BudgetVsActualRpcRow } from '@/lib/dashboard/get-dashboard-summary'
import { computeCategoryBadge } from '@/lib/dashboard/healthBadge'

interface BudgetVsActualTableProps {
  rows: BudgetVsActualRpcRow[]
  /** A = days elapsed ÷ days in month; 0 = future, 1 = historical */
  monthProgress: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function ProgressBar({ pct }: { pct: number }) {
  const filled = Math.min(pct, 100)
  const color = pct > 100 ? '#e24b4a' : pct >= 80 ? '#ef9f27' : '#1d9e75'
  return (
    <div style={{ width: '100%', height: '6px', border: '1px solid #e2e8f0', borderRadius: '3px', overflow: 'hidden', backgroundColor: 'transparent' }}>
      <div style={{ width: `${filled}%`, height: '100%', backgroundColor: color, borderRadius: '2px' }} />
    </div>
  )
}

const sectionOrder = [
  { key: 'income',     label: 'Income',     isIncome: true  },
  { key: 'standard',   label: 'Standard',   isIncome: false },
  { key: 'savings',    label: 'Savings',    isIncome: false },
  { key: 'investment', label: 'Investment', isIncome: false },
] as const

const COL_W = ['30%', '18%', '17%', '17%', '18%']

function ColGroup() {
  return (
    <colgroup>
      {COL_W.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  )
}

// height:'100%' fills the CSS grid cell — the grid row has a defined height
// from the flex:1 row container in the page's flex-column layout.
const cardStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflowX: 'auto',
  overflowY: 'hidden',
  minWidth: '600px',
}

export default function BudgetVsActualTable({ rows, monthProgress }: BudgetVsActualTableProps) {
  if (!rows.length) {
    return (
      <div
        className="rounded-lg border border-slate-300 bg-white"
        style={cardStyle}
      >
        <div className="flex-shrink-0" style={{ background: '#fef9c3', borderBottom: '1px solid #fde68a', padding: '6px 12px' }}>
          <h2 style={{ fontSize: 12, fontWeight: 500, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Budget vs Actual
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3 py-4 text-xs text-slate-500">
          No budget data for this month.
        </div>
      </div>
    )
  }

  const totals = rows.reduce(
    (acc, row) => { acc.budgeted += row.budgeted; acc.actual += row.actual; return acc },
    { budgeted: 0, actual: 0 }
  )
  const totalVariance = totals.budgeted - totals.actual
  const totalPct = totals.budgeted > 0 ? Math.round((totals.actual / totals.budgeted) * 100) : 0

  return (
    <div
      className="rounded-lg border border-slate-300 bg-white"
      style={cardStyle}
    >
      {/* Pinned header */}
      <div className="flex-shrink-0">
        <div style={{ background: '#fef9c3', borderBottom: '1px solid #fde68a', padding: '6px 12px' }}>
          <h2 style={{ fontSize: 12, fontWeight: 500, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Budget vs Actual
          </h2>
        </div>
        <table className="w-full table-fixed border-collapse" style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
          <ColGroup />
          <thead>
            <tr>
              <th className="px-3 py-1.5 text-left" style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</th>
              <th className="px-2 py-1.5 text-left" style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Progress</th>
              <th className="px-3 py-1.5 text-right" style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Budgeted</th>
              <th className="px-3 py-1.5 text-right" style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actual</th>
              <th className="px-3 py-1.5 text-right" style={{ fontSize: 10, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Variance</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable body — flex:1 + minHeight:0 required for overflow-y:auto to work */}
      <div
        className="bva-scroll"
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        <table className="w-full table-fixed border-collapse">
          <ColGroup />
          <tbody>
            {sectionOrder.map((section) => {
              const sectionRows = rows.filter((row) =>
                // Income identified by category_type (tag may be null for income rows).
                // Expense sections filtered by tag alone — avoids dependency on
                // category_type being present in the RPC response.
                section.key === 'income'
                  ? row.category_type === 'income'
                  : row.tag === section.key
              )
              if (!sectionRows.length) return null

              return (
                <Fragment key={section.key}>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <td colSpan={5} className="px-3 py-1 text-[13px] font-semibold uppercase tracking-wide text-slate-600">
                      {section.label}
                    </td>
                  </tr>
                  {sectionRows.map((row) => {
                    const badge = computeCategoryBadge(row.actual, row.budgeted, monthProgress, section.isIncome)
                    const pct = row.budgeted > 0 ? Math.round((row.actual / row.budgeted) * 100) : 0
                    const variance = row.budgeted - row.actual
                    const isOver = badge === 'red'
                    return (
                      <tr key={row.category_id} className="border-b border-slate-100">
                        <td className={`px-3 py-1.5 text-[13px] ${isOver ? 'font-medium text-[#d85a30]' : 'text-slate-700'}`}>
                          {row.category_name}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.budgeted > 0 ? <ProgressBar pct={pct} /> : <span className="text-[10px] text-slate-400">—</span>}
                        </td>
                        <td className="px-3 py-1.5 text-right text-[13px] tabular-nums text-slate-500">{formatCurrency(row.budgeted)}</td>
                        <td className="px-3 py-1.5 text-right text-[13px] tabular-nums text-slate-700">{formatCurrency(row.actual)}</td>
                        <td className={`px-3 py-1.5 text-right text-[13px] font-medium tabular-nums ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pinned totals footer */}
      <div className="flex-shrink-0 border-t border-slate-300">
        <table className="w-full table-fixed border-collapse bg-slate-50">
          <ColGroup />
          <tbody>
            <tr>
              <td className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Totals</td>
              <td className="px-2 py-1.5">{totals.budgeted > 0 ? <ProgressBar pct={totalPct} /> : null}</td>
              <td className="px-3 py-1.5 text-right text-[13px] font-semibold tabular-nums text-slate-800">{formatCurrency(totals.budgeted)}</td>
              <td className="px-3 py-1.5 text-right text-[13px] font-semibold tabular-nums text-slate-800">{formatCurrency(totals.actual)}</td>
              <td className={`px-3 py-1.5 text-right text-[13px] font-semibold tabular-nums ${totalVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
