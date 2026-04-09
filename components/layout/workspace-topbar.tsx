import type { ReactNode } from "react";

type WorkspaceTopbarProps = {
  title: string;
  description: string;
  controls?: ReactNode;
};

export default function WorkspaceTopbar({
  title,
  description,
  controls,
}: WorkspaceTopbarProps) {
  return (
    <header className="border-b border-slate-300 bg-white px-4 py-3 lg:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        {controls ? <div className="shrink-0">{controls}</div> : null}
      </div>
    </header>
  );
}
