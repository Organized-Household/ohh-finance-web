import InvestmentTrendChart from '@/components/dashboard/InvestmentTrendChart'
import IncomeExpenseChart from '@/components/dashboard/IncomeExpenseChart'
import SavingsGoalsChart from '@/components/dashboard/SavingsGoalsChart'
import type {
  MonthlyTrendPoint,
  InvestmentTrendPoint,
  SavingsGoal,
} from '@/lib/dashboard/get-dashboard-summary'

interface ChartStripProps {
  investmentTrend: InvestmentTrendPoint[] | null
  trend: MonthlyTrendPoint[] | null
  savingsGoals: SavingsGoal[] | null
  currentMonthStart: string
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white px-3 py-2">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </p>
      {children}
    </div>
  )
}

export default function ChartStrip({
  investmentTrend,
  trend,
  savingsGoals,
  currentMonthStart,
}: ChartStripProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '3fr 4fr 3fr',
        gap: '8px',
      }}
    >
      <ChartCard title="Investments — Contributions">
        <InvestmentTrendChart
          trend={investmentTrend}
          currentMonthStart={currentMonthStart}
        />
      </ChartCard>

      <ChartCard title="Income vs Expenses">
        <IncomeExpenseChart
          trend={trend ?? []}
          currentMonthStart={currentMonthStart}
        />
      </ChartCard>

      <ChartCard title="Savings Goals">
        <SavingsGoalsChart goals={savingsGoals} />
      </ChartCard>
    </div>
  )
}
