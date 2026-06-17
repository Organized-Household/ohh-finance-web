import Link from "next/link";

type PublicBrandHeaderProps = {
  current?: "welcome" | "login" | "register";
};

function linkClass(active: boolean) {
  return `inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
    active
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
  }`;
}

export default function PublicBrandHeader({ current }: PublicBrandHeaderProps) {
  return (
    <header className="w-full border-b border-slate-300 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
            OH
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Organized Household
          </span>
        </Link>

        <nav aria-label="Public navigation" className="flex flex-wrap items-center gap-2">
          <Link href="/login" className={linkClass(current === "login")}>
            Login
          </Link>
          <Link href="/register" className={linkClass(current === "register")}>
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
