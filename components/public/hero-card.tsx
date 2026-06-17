import Link from "next/link";

export default function HeroCard() {
  return (
    <section className="w-full max-w-2xl rounded-lg border border-slate-300 bg-white p-6 sm:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Organized Household
        </h1>
        <p className="max-w-xl text-sm text-slate-600 sm:text-base">
          Manage your household budget, categories, and transactions in one place.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Go to App
        </Link>

        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="inline-flex min-h-11 items-center justify-center rounded-md px-1 text-sm font-medium text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Register
        </Link>
      </div>
    </section>
  );
}
