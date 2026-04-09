import type { ReactNode } from "react";

export type WorkspaceLeftPanelSection = {
  title: string;
  content: ReactNode;
};

export const budgetWorkspaceLeftPanelSections: WorkspaceLeftPanelSection[] = [
  {
    title: "Household Member",
    content: (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
        Member selector placeholder. Shared member switching logic will be added
        in a future phase.
      </div>
    ),
  },
  {
    title: "Financial Distribution",
    content: (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
        Financial distribution placeholder for upcoming summary and allocation
        details.
      </div>
    ),
  },
  {
    title: "Pie Chart",
    content: (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-600">
        Pie chart placeholder
      </div>
    ),
  },
];

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
