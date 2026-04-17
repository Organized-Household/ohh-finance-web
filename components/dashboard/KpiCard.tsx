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
  red: 'bg-[#fcebeb] text-[#a32d2d]',
}

const valueClasses: Record<NonNullable<KpiCardProps['valueColor']>, string> = {
  income: 'text-emerald-700',
  expense: 'text-rose-700',
  net: 'text-slate-900',
}

export default function KpiCard({
  label,
  value,
  sub,
  badge,
  valueColor = 'net',
}: KpiCardProps) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`text-xl font-semibold tabular-nums ${valueClasses[valueColor]}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{sub}</p>
      <span
        className={`self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClasses[badge.status]}`}
      >
        {badge.label}
      </span>
    </div>
  )
}
