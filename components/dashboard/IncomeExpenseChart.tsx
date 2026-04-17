'use client'

import type { MonthlyTrendPoint } from '@/lib/dashboard/get-dashboard-summary'

interface IncomeExpenseChartProps {
  trend: MonthlyTrendPoint[]
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthAbbr(monthStart: string, isLast: boolean): string {
  const month = new Date(monthStart + 'T00:00:00Z').getUTCMonth()
  return isLast ? `${MONTH_ABBR[month]}*` : (MONTH_ABBR[month] ?? '')
}

export default function IncomeExpenseChart({ trend }: IncomeExpenseChartProps) {
  if (!trend.length) {
    return (
      <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">No trend data available.</p>
      </div>
    )
  }

  // Use up to 6 most recent months
  const months = trend.slice(-6)
  const n = months.length

  // SVG coordinate system
  const VW = 600
  const BAR_TOP = 8       // top of bar area
  const BAR_BOTTOM = 62   // bottom of bar area (baseline)
  const LABEL_Y = 76      // x-axis month labels
  const VH = 82           // total SVG viewBox height

  const groupW = VW / n
  const barW = Math.floor(groupW * 0.28)
  const gap = Math.floor(groupW * 0.04)

  const allValues = months.flatMap((m) => [m.income, m.expenses, Math.abs(m.income - m.expenses)])
  const maxVal = Math.max(...allValues, 1)

  function barHeight(value: number): number {
    return ((value / maxVal) * (BAR_BOTTOM - BAR_TOP))
  }

  // Net line points
  const netPoints = months
    .map((m, i) => {
      const net = m.income - m.expenses
      const cx = i * groupW + groupW / 2
      const h = (Math.abs(net) / maxVal) * (BAR_BOTTOM - BAR_TOP)
      // net >= 0: line above baseline; net < 0: line below baseline
      const cy = net >= 0 ? BAR_BOTTOM - h : BAR_BOTTOM + h
      return `${cx.toFixed(1)},${Math.max(BAR_TOP, Math.min(BAR_BOTTOM + 10, cy)).toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="rounded-lg border border-slate-300 bg-white px-4 py-3">
      {/* Legend */}
      <div className="mb-2 flex items-center gap-4 text-[11px] font-medium text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1d9e75]" />
          Income
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d85a30]" />
          Expenses
        </span>
        <span className="flex items-center gap-1">
          <svg width="18" height="10" className="inline-block">
            <line
              x1="0" y1="5" x2="18" y2="5"
              stroke="#185fa5"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
          Net
        </span>
      </div>

      {/* Chart — 90px wrapper */}
      <div style={{ height: 90 }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-label="6-month income vs expenses chart"
          role="img"
        >
          {/* Baseline */}
          <line
            x1={0} y1={BAR_BOTTOM}
            x2={VW} y2={BAR_BOTTOM}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {months.map((m, i) => {
            const groupX = i * groupW
            const centerX = groupX + groupW / 2
            const incomeH = barHeight(m.income)
            const expenseH = barHeight(m.expenses)
            const incomeX = centerX - barW - gap / 2
            const expenseX = centerX + gap / 2
            const isLast = i === months.length - 1

            return (
              <g key={m.month_start}>
                {/* Income bar */}
                {m.income > 0 && (
                  <rect
                    x={incomeX}
                    y={BAR_BOTTOM - incomeH}
                    width={barW}
                    height={incomeH}
                    fill="#1d9e75"
                    rx={1}
                  />
                )}
                {/* Expense bar */}
                {m.expenses > 0 && (
                  <rect
                    x={expenseX}
                    y={BAR_BOTTOM - expenseH}
                    width={barW}
                    height={expenseH}
                    fill="#d85a30"
                    rx={1}
                  />
                )}
                {/* Month label */}
                <text
                  x={centerX}
                  y={LABEL_Y}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isLast ? '#185fa5' : '#64748b'}
                  fontFamily="inherit"
                >
                  {monthAbbr(m.month_start, isLast)}
                </text>
              </g>
            )
          })}

          {/* Net savings dashed line */}
          {months.length > 1 && (
            <polyline
              points={netPoints}
              fill="none"
              stroke="#185fa5"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              strokeLinejoin="round"
            />
          )}

          {/* Net dot per month */}
          {months.map((m, i) => {
            const net = m.income - m.expenses
            const cx = i * groupW + groupW / 2
            const h = (Math.abs(net) / maxVal) * (BAR_BOTTOM - BAR_TOP)
            const cy = net >= 0 ? BAR_BOTTOM - h : BAR_BOTTOM + h
            const clampedCy = Math.max(BAR_TOP, Math.min(BAR_BOTTOM + 10, cy))
            return (
              <circle
                key={m.month_start}
                cx={cx}
                cy={clampedCy}
                r={2.5}
                fill="#185fa5"
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}
