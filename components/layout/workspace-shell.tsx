"use client";

import { ReactNode } from "react";
import { Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface WorkspaceShellProps {
  title: string;
  description?: string;
  topbarControls?: ReactNode;
  leftPanelSections?: Array<{
    title: string;
    items: Array<{
      label: string;
      href: string;
      icon?: ReactNode;
    }>;
  }>;
  children: ReactNode;
  isAdmin?: boolean;
  currentUserId?: string;
  activeMemberId?: string;
}

export function WorkspaceShell({
  title,
  description,
  topbarControls,
  leftPanelSections,
  children,
  isAdmin,
  currentUserId,
  activeMemberId,
}: WorkspaceShellProps) {
  const isNonProduction = process.env.NEXT_PUBLIC_APP_ENV !== "production";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Environment banner */}
      {isNonProduction && (
        <div className="w-full bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-900">
          ⚠ Non-production environment — do not enter real financial data
        </div>
      )}

      {/* Top bar */}
      <header className="border-b">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {topbarControls && <div className="flex gap-2">{topbarControls}</div>}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Left panel (optional) */}
        {leftPanelSections && leftPanelSections.length > 0 && (
          <aside className="w-64 border-r bg-muted/40">
            <nav className="space-y-6 p-6">
              {leftPanelSections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
