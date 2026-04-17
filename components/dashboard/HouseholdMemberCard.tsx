interface HouseholdMemberCardProps {
  displayName: string
  role: 'admin' | 'member'
  pendingReviewCount: number
  budgetIsSet: boolean
  lastImportDate: string | null
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function HouseholdMemberCard({
  displayName,
  role,
  pendingReviewCount,
  budgetIsSet,
  lastImportDate,
}: HouseholdMemberCardProps) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-4 py-3 flex flex-col gap-3">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {initials(displayName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
          <p className="text-[11px] capitalize text-slate-500">{role}</p>
        </div>
      </div>

      {/* Stat rows */}
      <div className="space-y-1.5">
        {/* Pending review */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Pending review</span>
          <span
            className={`font-semibold tabular-nums ${
              pendingReviewCount > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {pendingReviewCount > 0 ? pendingReviewCount : '—'}
          </span>
        </div>

        {/* Budget set */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Budget set</span>
          {budgetIsSet ? (
            <span className="font-semibold text-emerald-600">Yes</span>
          ) : (
            <span className="font-semibold text-rose-600">No</span>
          )}
        </div>

        {/* Last import */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Last import</span>
          <span className="tabular-nums text-slate-600">
            {lastImportDate ?? '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
