"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
        fill="currentColor"
      />
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
  // If true, this link preserves ?member= for member-scoped pages
  memberScoped?: boolean;
};

const mainNavItems: MainNavItem[] = [
  {
    href: "/app",
    label: "Home",
    icon: <HomeIcon />,
    isActive: (p) => p === "/app",
    memberScoped: true,
  },
  {
    href: "/app/budgets/categories",
    label: "Categories",
    icon: <CategoriesIcon />,
    isActive: (p) => p.startsWith("/app/budgets/categories"),
    memberScoped: false, // shared data — no ?member=
  },
  {
    href: "/app/budgets",
    label: "Budget",
    icon: <BudgetIcon />,
    isActive: (p) => p === "/app/budgets",
    memberScoped: true,
  },
  {
    href: "/app/transactions",
    label: "Transactions",
    icon: <TransactionsIcon />,
    isActive: (p) => p.startsWith("/app/transactions"),
    memberScoped: true,
  },
];

const accountSubItems = [
  { href: "/app/accounts/savings",     label: "Savings" },
  { href: "/app/accounts/investments", label: "Investments" },
  { href: "/app/accounts/debts",       label: "Debts" },
];

const settingsSubItems = [
  { href: "/app/settings/profile", label: "My Profile" },
  { href: "/app/settings/members", label: "Members" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
  currentUserId?: string;
  activeMemberId?: string;
};

export default function AppSidebar({
  collapsed,
  onToggle,
  isAdmin = false,
  currentUserId = "",
  activeMemberId = "",
}: AppSidebarProps) {
  const pathname = usePathname();
  const isOnAccountsRoute = pathname.startsWith("/app/accounts");
  const isOnSettingsRoute = pathname.startsWith("/app/settings");
  const [accountsOpen, setAccountsOpen] = useState(isOnAccountsRoute);
  const [settingsOpen, setSettingsOpen] = useState(isOnSettingsRoute);

  // Append ?member=uuid to member-scoped nav links when admin is
  // viewing a different member's data, so the context is preserved.
  const withMember = (href: string, memberScoped = true): string => {
    if (!memberScoped || !isAdmin || !activeMemberId || activeMemberId === currentUserId) {
      return href;
    }
    return `${href}?member=${activeMemberId}`;
  };

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
              const href = withMember(item.href, item.memberScoped);
              return (
                <li key={item.href} className="nav-item-wrapper" data-tooltip={item.label}>
                  <Link
                    href={href}
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
                  href={withMember("/app/accounts/savings")}
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
                              href={withMember(sub.href)}
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
            {/* Divider */}
            <li aria-hidden="true">
              <hr style={{
                border: "none",
                borderTop: "0.5px solid rgba(255,255,255,0.1)",
                margin: "8px 4px",
              }} />
            </li>

            {/* Settings group */}
            <li className="nav-item-wrapper" data-tooltip="Settings">
              {collapsed ? (
                <Link
                  href="/app/settings/profile"
                  className={`flex items-center justify-center rounded-md px-2.5 py-2 text-sm font-medium transition ${
                    isOnSettingsRoute
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-label="Settings"
                >
                  <SettingsIcon />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition ${
                      isOnSettingsRoute
                        ? "text-slate-100"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <SettingsIcon />
                    <span className="flex-1 text-left">Settings</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3.5 transition-transform"
                      style={{ transform: settingsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {settingsOpen && (
                    <ul className="mt-1 space-y-1 pl-8">
                      {settingsSubItems.map((sub) => {
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
