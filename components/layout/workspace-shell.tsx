"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import AppSidebar from "@/components/layout/app-sidebar";
import WorkspaceTopbar from "@/components/layout/workspace-topbar";
import WorkspaceLeftPanel, {
  type WorkspaceLeftPanelSection,
} from "@/components/layout/workspace-left-panel";

type WorkspaceShellProps = {
  title: string;
  description: string;
  topbarControls?: ReactNode;
  leftPanelSections: WorkspaceLeftPanelSection[];
  children: ReactNode;
};

export default function WorkspaceShell({
  title,
  description,
  topbarControls,
  leftPanelSections,
  children,
}: WorkspaceShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar
          title={title}
          description={description}
          controls={topbarControls}
        />

        <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:p-5">
          <WorkspaceLeftPanel sections={leftPanelSections} />

          <main className="min-w-0 rounded-lg border border-slate-300 bg-white p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
