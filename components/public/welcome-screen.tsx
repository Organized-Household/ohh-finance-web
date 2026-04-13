import Link from "next/link";
import WelcomeHeroSlideshow from "./welcome-hero-slideshow";

function HeroCardContent() {
  return (
    <div className="w-full rounded-xl border border-slate-300 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Organized Household
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Take Control of Your Household Finances - Together 💡
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            OHh-Finance helps your household plan, track, and understand your complete financial
            picture in one secure place.
          </p>
        </div>

        <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
          <li>Track income and expenses by month 📊</li>
          <li>Build budgets aligned with your financial goals 🎯</li>
          <li>Monitor savings, investments, and debts 💰</li>
          <li>Import transactions and categorize spending quickly ⚡</li>
          <li className="sm:col-span-2">View a clear monthly snapshot of your financial progress 🗓️</li>
        </ul>

        <p className="text-sm text-slate-600">
          Designed for households, OHh-Finance brings clarity to everyday financial decisions —
          helping you stay organized and confident about where your money is going.
        </p>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-900">
            Create your household account to get started.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Register Household
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            Your household workspace is private and securely isolated.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WelcomeScreen() {
  return (
    <section className="w-full">
      <div className="space-y-4 lg:space-y-0">
        <div className="relative">
          <WelcomeHeroSlideshow />

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-end p-8 lg:flex xl:p-10">
            <div className="pointer-events-auto w-full max-w-xl">
              <HeroCardContent />
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <HeroCardContent />
        </div>
      </div>
    </section>
  );
}
