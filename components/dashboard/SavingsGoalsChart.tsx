'use client'

import type { SavingsGoal } from '@/lib/dashboard/get-dashboard-summary'

interface SavingsGoalsChartProps {
  goals: SavingsGoal[] | null
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

function fmtK(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
  return `$${Math.round(v)}`
}

export default function SavingsGoalsChart({ goals }: SavingsGoalsChartProps) {
  const validGoals = (goals ?? []).filter((g) => g.target_amount > 0)

  if (!validGoals.length) {
    return (
      <div style={{
        height: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 12px',
        fontSize: '10px',
        color: '#94a3b8',
        lineHeight: 1.4,
      }}>
        Set a target on your savings accounts to track progress.
      </div>
    )
  }

  // SVG layout — grouped bars (target + contributed) per account
  const VW = 300
  const TOP      = 4
  const BOTTOM   = 58
  const LABEL_Y  = 72
  const VH       = 78
  const BAR_AREA = BOTTOM - TOP

  const maxVal = Math.max(...validGoals.flatMap((g) => [g.target_amount, g.contributed_all_time]), 1)

  const n = validGoals.length
  const groupW = VW / n
  const barW = Math.min(Math.floor(groupW * 0.3), 18)
  const gap = 3

  return (
    <div style={{ height: 90 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#64748b', marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#9fe1cb', display: 'inline-block' }} />
          Target
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#1d9e75', display: 'inline-block' }} />
          Contributed
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        aria-label="Savings goals: target vs contributed"
        role="img"
      >
        {/* Baseline */}
        <line x1={0} y1={BOTTOM} x2={VW} y2={BOTTOM} stroke="#e2e8f0" strokeWidth="1" />

        {validGoals.map((g, i) => {
          const cx = i * groupW + groupW / 2
          const targetH = (g.target_amount / maxVal) * BAR_AREA
          const contribH = (g.contributed_all_time / maxVal) * BAR_AREA

          const targetX = cx - barW - gap / 2
          const contribX = cx + gap / 2

          const pct = g.target_amount > 0
            ? Math.min(100, Math.round((g.contributed_all_time / g.target_amount) * 100))
            : 0

          return (
            <g key={g.id}>
              {/* Target bar (light green) */}
              <rect
                x={targetX}
                y={BOTTOM - targetH}
                width={barW}
                height={Math.max(targetH, 1)}
                fill="#9fe1cb"
                rx={2}
              />
              {/* Contributed bar (dark green) */}
              {g.contributed_all_time > 0 && (
                <rect
                  x={contribX}
                  y={BOTTOM - contribH}
                  width={barW}
                  height={Math.max(contribH, 1)}
                  fill="#1d9e75"
                  rx={2}
                />
              )}
              {/* Account name label */}
              <text
                x={cx}
                y={LABEL_Y}
                textAnchor="middle"
                fontSize={8}
                fill="#64748b"
                fontFamily="inherit"
              >
                {truncate(g.name, 10)}
              </text>
              {/* % progress label above contributed bar */}
              {g.contributed_all_time > 0 && (
                <text
                  x={contribX + barW / 2}
                  y={Math.max(BOTTOM - contribH - 2, TOP + 8)}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#065f46"
                  fontFamily="inherit"
                >
                  {pct}%
                </text>
              )}
            </g>
          )
        })}

        {/* Y-axis max label */}
        <text x={2} y={TOP + 7} fontSize={8} fill="#94a3b8" fontFamily="inherit">
          {fmtK(maxVal)}
        </text>
      </svg>
    </div>
  )
}
