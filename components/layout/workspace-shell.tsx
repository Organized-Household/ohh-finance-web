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
  // Case C fix: persist in localStorage so re-mount on route change doesn't reset to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar
        collapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar
          title={title}
          description={description}
          controls={topbarControls}
        />

        <div className="grid flex-1 gap-3 px-3 pb-3 pt-2 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-4 lg:px-4 lg:pb-4 lg:pt-3">
          <WorkspaceLeftPanel sections={leftPanelSections} />

          <main className="min-w-0 rounded-lg border border-slate-300 bg-white p-3 lg:p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
