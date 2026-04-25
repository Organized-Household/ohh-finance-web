import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  right?: ReactNode; // optional — month picker or nothing
}

// Unified page header used by all app pages via WorkspaceShell.
// title is always left-aligned; right slot is vertically centred with the title.
// description renders as a muted sub-line below the title when provided.
export default function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <header className="border-b border-slate-300 bg-white px-4 py-3 lg:px-5">
      <div className="flex items-center justify-between gap-4">
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
    </header>
  );
}
