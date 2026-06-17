import type { HealthBadge } from '@/lib/dashboard/healthBadge'

interface KpiCardProps {
  label: string
  value: string
  sub: string
  badge: HealthBadge
  valueColor?: 'income' | 'expense' | 'net'
}

const badgeClasses: Record<HealthBadge['status'], string> = {
  green: 'bg-[#eaf3de] text-[#3b6d11]',
  amber: 'bg-[#faeeda] text-[#854f0b]',
  red:   'bg-[#fcebeb] text-[#a32d2d]',
}

const valueColorMap: Record<NonNullable<KpiCardProps['valueColor']>, string> = {
  income:  '#1d9e75',
  expense: '#d85a30',
  net:     '#185fa5',
}

export default function KpiCard({
  label,
  value,
  sub,
  badge,
  valueColor = 'net',
}: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2">
      {/* Left: label + badge */}
      <div className="flex flex-shrink-0 flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        <span
          className={`self-start rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight ${badgeClasses[badge.status]}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-8 w-px flex-shrink-0 bg-slate-200" />

      {/* Right: value + sub */}
      <div className="min-w-0 text-right">
        <p
          className="text-[22px] font-medium tabular-nums leading-tight"
          style={{ color: valueColorMap[valueColor] }}
        >
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>
      </div>
    </div>
  )
}
