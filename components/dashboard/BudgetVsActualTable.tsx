'use client'

import { Fragment } from 'react'
import type { BudgetVsActualRpcRow } from '@/lib/dashboard/get-dashboard-summary'
import { computeCategoryBadge } from '@/lib/dashboard/healthBadge'

interface BudgetVsActualTableProps {
  rows: BudgetVsActualRpcRow[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const progressBarColor: Record<ReturnType<typeof computeCategoryBadge>, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-400',
  red: 'bg-rose-500',
}

const sectionOrder = [
  { key: 'income' as const, label: 'Income', matchType: 'income' as const },
  { key: 'standard', label: 'Standard', matchTag: 'standard' },
  { key: 'savings', label: 'Savings', matchTag: 'savings' },
  { key: 'investment', label: 'Investment', matchTag: 'investment' },
]

export default function BudgetVsActualTable({ rows }: BudgetVsActualTableProps) {
  if (!rows.length) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-slate-50 px-3 py-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Budget vs Actual
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-3 py-6 text-sm text-slate-500">
          No budget data for this month.
        </div>
      </div>
    )
  }

  const totals = rows.reduce(
    (acc, row) => {
      acc.budgeted += row.budgeted
      acc.actual += row.actual
      return acc
    },
    { budgeted: 0, actual: 0 }
  )

  const totalsBadge = computeCategoryBadge(totals.actual, totals.budgeted)

  // Shared column width classes for alignment between header/body/footer tables
  const colCategory = 'w-[44%]'
  const colBudgeted = 'w-[20%]'
  const colActual = 'w-[20%]'
  const colProgress = 'w-[16%]'

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-300 bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex-shrink-0 border-b border-slate-300 bg-slate-50 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Budget vs Actual
        </h2>
      </div>

      {/* Sticky column headers */}
      <div className="flex-shrink-0">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className={colCategory} />
            <col className={colBudgeted} />
            <col className={colActual} />
            <col className={colProgress} />
          </colgroup>
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                Category
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                Budgeted
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                Actual
              </th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                Used
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className={colCategory} />
            <col className={colBudgeted} />
            <col className={colActual} />
            <col className={colProgress} />
          </colgroup>
          <tbody>
            {sectionOrder.map((section) => {
              const sectionRows = rows.filter((row) => {
                if (section.key === 'income') return row.category_type === 'income'
                return row.category_type === 'expense' && row.tag === section.matchTag
              })

              if (!sectionRows.length) return null

              return (
                <Fragment key={section.key}>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <td
                      colSpan={4}
                      className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {section.label}
                    </td>
                  </tr>

                  {sectionRows.map((row) => {
                    const badge = computeCategoryBadge(row.actual, row.budgeted)
                    const pct =
                      row.budgeted > 0
                        ? Math.min(100, Math.round((row.actual / row.budgeted) * 100))
                        : 0
                    const overBudget = row.actual > row.budgeted && row.budgeted > 0

                    return (
                      <tr key={row.category_id} className="border-b border-slate-200">
                        <td
                          className={`px-3 py-2 text-sm ${
                            overBudget
                              ? 'font-medium text-[#d85a30]'
                              : 'text-slate-700'
                          }`}
                        >
                          {row.category_name}
                          {row.budgeted > 0 && (
                            <div className="mt-1 h-1 w-full rounded-full bg-slate-100">
                              <div
                                className={`h-1 rounded-full ${progressBarColor[badge]}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-600">
                          {formatCurrency(row.budgeted)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm tabular-nums text-slate-700">
                          {formatCurrency(row.actual)}
                        </td>
                        <td className="px-3 py-2 text-right text-xs tabular-nums text-slate-500">
                          {row.budgeted > 0 ? `${pct}%` : '—'}
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

      {/* Pinned totals row */}
      <div className="flex-shrink-0 border-t border-slate-300">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className={colCategory} />
            <col className={colBudgeted} />
            <col className={colActual} />
            <col className={colProgress} />
          </colgroup>
          <tbody>
            <tr className="bg-slate-50">
              <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Totals
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrency(totals.budgeted)}
              </td>
              <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-slate-900">
                {formatCurrency(totals.actual)}
              </td>
              <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums text-slate-600">
                {totals.budgeted > 0
                  ? `${Math.round((totals.actual / totals.budgeted) * 100)}%`
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
