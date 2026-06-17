import type { ReactNode } from "react";

export type WorkspaceLeftPanelSection = {
  title: string;
  content: ReactNode;
};

type WorkspaceLeftPanelProps = {
  sections: WorkspaceLeftPanelSection[];
};

export default function WorkspaceLeftPanel({ sections }: WorkspaceLeftPanelProps) {
  return (
    <aside className="space-y-3">
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-lg border border-slate-300 bg-white p-3"
        >
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {section.title}
          </h2>
          {section.content}
        </section>
      ))}
    </aside>
  );
}
