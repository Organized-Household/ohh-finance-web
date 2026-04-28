import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  right?: ReactNode; // optional — month picker or nothing
  /** Hamburger button injected by WorkspaceShellClient; only visible on mobile */
  mobileMenuButton?: ReactNode;
}

// Unified page header used by all app pages via WorkspaceShell.
// On mobile: hamburger left, title+right stack below.
// On sm+: title left, right slot aligned right — single row.
// description renders as a muted sub-line below the title when provided.
export default function PageHeader({ title, description, right, mobileMenuButton }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-300 bg-white px-4 py-3 lg:px-5">
      <div className="flex items-start gap-3 sm:items-center">
        {/* Hamburger — only rendered on mobile */}
        {mobileMenuButton && (
          <div className="shrink-0 pt-0.5 sm:hidden">{mobileMenuButton}</div>
        )}

        {/* Title + description grow to fill available width */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-slate-600">{description}</p>
              )}
            </div>
            {right && (
              <div className="flex shrink-0 items-center">{right}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
