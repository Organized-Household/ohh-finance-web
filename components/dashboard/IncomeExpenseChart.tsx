'use client'

import type { MonthlyTrendPoint } from '@/lib/dashboard/get-dashboard-summary'
import { buildSixMonthSlots } from '@/lib/dashboard/chartUtils'

interface IncomeExpenseChartProps {
  trend: MonthlyTrendPoint[]
  /** ISO YYYY-MM-01 for the selected month — used to anchor the 6-slot window */
  currentMonthStart: string
}

// Cap bar width so single-month data doesn't stretch the full group width
const MAX_BAR_W = 32

export default function IncomeExpenseChart({
  trend,
  currentMonthStart,
}: IncomeExpenseChartProps) {
  const months = buildSixMonthSlots(trend, currentMonthStart)
  const N = months.length  // always 6

  // SVG coordinate system
  const VW = 600
  const BAR_TOP    = 6
  const BAR_BOTTOM = 56
  const LABEL_Y    = 70
  const VH         = 76

  const groupW = VW / N
  const rawBarW = Math.floor(groupW * 0.28)
  const barW = Math.min(rawBarW, MAX_BAR_W)
  const gap = 3

  const allValues = months.flatMap((m) => [
    m.income,
    m.expenses,
    Math.abs(m.income - m.expenses),
  ])
  const maxVal = Math.max(...allValues, 1)

  function barH(value: number): number {
    return (value / maxVal) * (BAR_BOTTOM - BAR_TOP)
  }

  // Net line points
  const netPoints = months
    .map((m, i) => {
      const net = m.income - m.expenses
      const cx = i * groupW + groupW / 2
      const h = (Math.abs(net) / maxVal) * (BAR_BOTTOM - BAR_TOP)
      const cy = net >= 0 ? BAR_BOTTOM - h : BAR_BOTTOM + h
      return `${cx.toFixed(1)},${Math.max(BAR_TOP, Math.min(BAR_BOTTOM + 8, cy)).toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
      {/* Legend */}
      <div className="mb-1.5 flex items-center gap-3 text-[11px] font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-[#1d9e75]" />
          Income
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-[#d85a30]" />
          Expenses
        </span>
        <span className="flex items-center gap-1">
          <svg width="16" height="8" className="inline-block">
            <line x1="0" y1="4" x2="16" y2="4" stroke="#185fa5" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
          Net
        </span>
      </div>

      {/* Chart — 80px wrapper */}
      <div style={{ height: 80 }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-label="6-month income vs expenses chart"
          role="img"
        >
          {/* Baseline */}
          <line x1={0} y1={BAR_BOTTOM} x2={VW} y2={BAR_BOTTOM} stroke="#e2e8f0" strokeWidth="1" />

          {months.map((m, i) => {
            const cx = i * groupW + groupW / 2
            const incomeH = barH(m.income)
            const expenseH = barH(m.expenses)
            const incomeX = cx - barW - gap / 2
            const expenseX = cx + gap / 2
            const isCurrent = i === N - 1

            return (
              <g key={m.key}>
                {m.income > 0 && (
                  <rect
                    x={incomeX} y={BAR_BOTTOM - incomeH}
                    width={barW} height={incomeH}
                    fill="#1d9e75" rx={1}
                  />
                )}
                {m.expenses > 0 && (
                  <rect
                    x={expenseX} y={BAR_BOTTOM - expenseH}
                    width={barW} height={expenseH}
                    fill="#d85a30" rx={1}
                  />
                )}
                <text
                  x={cx} y={LABEL_Y}
                  textAnchor="middle"
                  fontSize={10}
                  fill={isCurrent ? '#185fa5' : '#64748b'}
                  fontFamily="inherit"
                >
                  {m.label}
                </text>
              </g>
            )
          })}

          {/* Net dashed line */}
          <polyline
            points={netPoints}
            fill="none"
            stroke="#185fa5"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            strokeLinejoin="round"
          />

          {/* Net dots */}
          {months.map((m, i) => {
            const net = m.income - m.expenses
            const cx = i * groupW + groupW / 2
            const h = (Math.abs(net) / maxVal) * (BAR_BOTTOM - BAR_TOP)
            const cy = net >= 0 ? BAR_BOTTOM - h : BAR_BOTTOM + h
            return (
              <circle
                key={m.key}
                cx={cx}
                cy={Math.max(BAR_TOP, Math.min(BAR_BOTTOM + 8, cy))}
                r={2}
                fill="#185fa5"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
