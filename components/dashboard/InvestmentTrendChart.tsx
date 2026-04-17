'use client'

import type { InvestmentTrendPoint } from '@/lib/dashboard/get-dashboard-summary'
import { buildSixMonthSlots } from '@/lib/dashboard/chartUtils'

interface InvestmentTrendChartProps {
  trend: InvestmentTrendPoint[] | null
  currentMonthStart: string
}

export default function InvestmentTrendChart({
  trend,
  currentMonthStart,
}: InvestmentTrendChartProps) {
  const rawTrend = (trend ?? []).map((t) => ({
    month_start: t.month_start,
    income: t.monthly_contributions,
    expenses: 0,
  }))

  const months = buildSixMonthSlots(rawTrend, currentMonthStart)
  const values = months.map((m) => m.income)
  const maxVal = Math.max(...values, 1)

  // SVG coordinate system
  const VW = 300
  const TOP    = 6
  const BOTTOM = 58
  const LABEL_Y = 72
  const VH      = 78

  const slotW = VW / months.length

  // Build polyline + fill area points
  const linePoints = months.map((m, i) => {
    const cx = i * slotW + slotW / 2
    const h = (m.income / maxVal) * (BOTTOM - TOP)
    const cy = BOTTOM - h
    return { cx, cy }
  })

  const polylineStr = linePoints.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ')

  // Area: start from baseline-left, go along line, close at baseline-right
  const first = linePoints[0]
  const last  = linePoints[linePoints.length - 1]
  const areaStr = [
    `${first.cx.toFixed(1)},${BOTTOM}`,
    polylineStr,
    `${last.cx.toFixed(1)},${BOTTOM}`,
  ].join(' ')

  const hasData = values.some((v) => v > 0)

  function fmtK(v: number): string {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v}`
  }

  return (
    <div style={{ height: 90, position: 'relative' }}>
      {!hasData ? (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: '#94a3b8',
        }}>
          No investment contributions yet.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-label="6-month investment contribution trend"
          role="img"
        >
          {/* Baseline */}
          <line x1={0} y1={BOTTOM} x2={VW} y2={BOTTOM} stroke="#e2e8f0" strokeWidth="1" />

          {/* Area fill */}
          <polygon
            points={areaStr}
            fill="rgba(24,95,165,0.07)"
          />

          {/* Line */}
          <polyline
            points={polylineStr}
            fill="none"
            stroke="#185fa5"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {linePoints.map((p, i) => (
            <circle key={months[i].key} cx={p.cx} cy={p.cy} r={2} fill="#185fa5" />
          ))}

          {/* Month labels */}
          {months.map((m, i) => {
            const cx = i * slotW + slotW / 2
            const isCurrent = i === months.length - 1
            return (
              <text
                key={m.key}
                x={cx} y={LABEL_Y}
                textAnchor="middle"
                fontSize={9}
                fill={isCurrent ? '#185fa5' : '#64748b'}
                fontFamily="inherit"
              >
                {m.label}
              </text>
            )
          })}

          {/* Y-axis max label */}
          <text x={4} y={TOP + 6} fontSize={8} fill="#94a3b8" fontFamily="inherit">
            {fmtK(maxVal)}
          </text>
        </svg>
      )}
    </div>
  )
}
