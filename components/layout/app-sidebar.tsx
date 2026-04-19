"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M3.75 10.5 12 3.75l8.25 6.75v9a.75.75 0 0 1-.75.75h-4.5v-6h-6v6h-4.5a.75.75 0 0 1-.75-.75v-9Z" fill="currentColor" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M4.5 4.5h6.75v6.75H4.5V4.5Zm8.25 0h6.75v6.75h-6.75V4.5ZM4.5 12.75h6.75v6.75H4.5v-6.75Zm8.25 0h6.75v6.75h-6.75v-6.75Z" fill="currentColor" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M4.5 5.25h15a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75Zm2.25 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 3.75a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" fill="currentColor" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V6.75A2.25 2.25 0 0 1 5.25 4.5Zm1.5 3a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H6.75Zm0 3.75a.75.75 0 0 0 0 1.5h6.75a.75.75 0 0 0 0-1.5H6.75Z" fill="currentColor" />
    </svg>
  );
}

function AccountsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M12 3.75a6.75 6.75 0 1 0 6.75 6.75A6.758 6.758 0 0 0 12 3.75Zm.75 10.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-.75a2.25 2.25 0 0 1 0-4.5h2.25a.75.75 0 1 0 0-1.5h-2.25a.75.75 0 0 1 0-1.5h.75v-1.5a.75.75 0 0 1 1.5 0v1.5h.75a2.25 2.25 0 0 1 0 4.5h-2.25a.75.75 0 1 0 0 1.5h2.25a.75.75 0 0 1 0 1.5h-.75Z" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

type MainNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

const mainNavItems: MainNavItem[] = [
  {
    href: "/app",
    label: "Home",
    icon: <HomeIcon />,
    isActive: (p) => p === "/app",
  },
  {
    href: "/app/budgets/categories",
    label: "Categories",
    icon: <CategoriesIcon />,
    isActive: (p) => p.startsWith("/app/budgets/categories"),
  },
  {
    href: "/app/budgets",
    label: "Budget",
    icon: <BudgetIcon />,
    isActive: (p) => p === "/app/budgets",
  },
  {
    href: "/app/transactions",
    label: "Transactions",
    icon: <TransactionsIcon />,
    isActive: (p) => p.startsWith("/app/transactions"),
  },
];

const accountSubItems = [
  { href: "/app/accounts/savings",     label: "Savings" },
  { href: "/app/accounts/investments", label: "Investments" },
  { href: "/app/accounts/debts",       label: "Debts" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const isOnAccountsRoute = pathname.startsWith("/app/accounts");
  const [accountsOpen, setAccountsOpen] = useState(isOnAccountsRoute);

  return (
    <aside
      className={`border-r border-slate-300 bg-slate-900 text-slate-100 transition-all duration-200 ${
        collapsed ? "w-20 sidebar-collapsed" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-900">
              OH
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">OHh Finance</p>
                <p className="truncate text-xs text-slate-400">Workspace</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex size-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              {collapsed ? (
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" />
              ) : (
                <path d="M15 6 9 12l6 6" fill="none" stroke="currentColor" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1.5">
            {/* Main nav items: Home, Categories, Budget, Transactions */}
            {mainNavItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <li key={item.href} className="nav-item-wrapper" data-tooltip={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md px-2.5 py-2 text-sm font-medium transition ${
                      collapsed ? "justify-center" : "gap-2.5"
                    } ${
                      active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.icon}</span>
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}

            {/* Divider */}
            <li aria-hidden="true">
              <hr style={{
                border: "none",
                borderTop: "0.5px solid rgba(255,255,255,0.1)",
                margin: "8px 4px",
              }} />
            </li>

            {/* Accounts group */}
            <li className="nav-item-wrapper" data-tooltip="Accounts">
              {collapsed ? (
                /* Collapsed sidebar: single icon navigates to Savings */
                <Link
                  href="/app/accounts/savings"
                  className={`flex items-center justify-center rounded-md px-2.5 py-2 text-sm font-medium transition ${
                    isOnAccountsRoute
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-label="Accounts"
                >
                  <AccountsIcon />
                </Link>
              ) : (
                /* Expanded sidebar: collapsible group */
                <>
                  <button
                    type="button"
                    onClick={() => setAccountsOpen((prev) => !prev)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                      isOnAccountsRoute
                        ? "text-slate-100"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <AccountsIcon />
                    <span className="flex-1 text-left">Accounts</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 transition-transform"
                      style={{ transform: accountsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {accountsOpen && (
                    <ul className="mt-1 space-y-1 pl-8">
                      {accountSubItems.map((sub) => {
                        const active = pathname.startsWith(sub.href);
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`flex items-center rounded-md px-2.5 py-1.5 text-sm transition ${
                                active
                                  ? "bg-slate-100 font-medium text-slate-900"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                              }`}
                              aria-current={active ? "page" : undefined}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
