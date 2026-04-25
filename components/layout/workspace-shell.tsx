"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import AppSidebar from "@/components/layout/app-sidebar";
import PageHeader from "@/components/layout/PageHeader";
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
    // h-screen + overflow-hidden constrains everything to the viewport —
    // required so flex-1 children can propagate a defined height down
    // to page content (enabling CSS-only viewport-fill layouts).
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AppSidebar
        collapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          title={title}
          description={description}
          right={topbarControls}
        />

        {/* min-h-0 prevents flex overflow; gridTemplateRows:1fr makes the
            single row fill the grid's available height so <main> can use height:100% */}
        <div
          className="grid min-h-0 flex-1 gap-3 px-3 pb-3 pt-2 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-4 lg:px-4 lg:pb-4 lg:pt-3"
          style={{ gridTemplateRows: "1fr" }}
        >
          <WorkspaceLeftPanel sections={leftPanelSections} />

          {/* overflow-auto: pages with tall content scroll inside <main>;
              pages that use height:100% fill the cell without triggering scroll */}
          <main className="min-w-0 overflow-auto rounded-lg border border-slate-300 bg-white p-3 lg:p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
