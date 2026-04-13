import Link from "next/link";
import WelcomeHeroSlideshow from "./welcome-hero-slideshow";

function HeroCardContent() {
  return (
    <div className="w-full rounded-2xl border border-white/40 bg-white/35 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
            Organized Household
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Take Control of Your Household Finances - Together 💡
          </h1>
          <p className="max-w-2xl text-sm text-slate-700 sm:text-base">
            OHh-Finance helps your household plan, track, and understand your complete financial
            picture in one secure place.
          </p>
        </div>

        <ul className="grid gap-2 text-sm text-slate-800">
          <li>Track income and expenses by month 📊</li>
          <li>Build budgets aligned with your financial goals 🎯</li>
          <li>Monitor savings, investments, and debts 💰</li>
          <li>Import transactions and categorize spending quickly ⚡</li>
          <li>View a clear monthly snapshot of your financial progress 🗓️</li>
        </ul>

        <p className="text-sm text-slate-700">
          Designed for households, OHh-Finance brings clarity to everyday financial decisions -
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
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-400/80 bg-white/80 px-4 text-sm font-medium text-slate-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-slate-600">
            Your household workspace is private and securely isolated.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WelcomeScreen() {
  return (
    <section className="flex h-full w-full flex-col bg-slate-900">
      <div className="relative h-[calc(100dvh-76px)] min-h-[520px] overflow-hidden bg-slate-900">
        <WelcomeHeroSlideshow />

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-end p-6 lg:flex xl:p-10">
          <div className="pointer-events-auto w-full max-w-xl">
            <HeroCardContent />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 lg:hidden">
        <HeroCardContent />
      </div>
    </section>
  );
}
