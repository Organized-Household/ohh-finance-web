"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import AppSidebar from "@/components/layout/app-sidebar";
import PageHeader from "@/components/layout/PageHeader";
import WorkspaceLeftPanel, {
  type WorkspaceLeftPanelSection,
} from "@/components/layout/workspace-left-panel";

export type WorkspaceShellClientProps = {
  title: string;
  description: string;
  topbarControls?: ReactNode;
  leftPanelSections: WorkspaceLeftPanelSection[];
  children: ReactNode;
  isAdmin?: boolean;
  currentUserId?: string;
  activeMemberId?: string;
};

export default function WorkspaceShellClient({
  title,
  description,
  topbarControls,
  leftPanelSections,
  children,
  isAdmin = false,
  currentUserId = "",
  activeMemberId = "",
}: WorkspaceShellClientProps) {
  // Persist collapse state in localStorage so re-mount on route change
  // doesn't reset to false.
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

  // Hamburger button shown only on mobile (md:hidden) when sidebar is collapsed
  const mobileMenuButton = (
    <button
      type="button"
      onClick={handleSidebarToggle}
      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 md:hidden"
      aria-label="Open menu"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  return (
    // h-screen + overflow-hidden constrains everything to the viewport —
    // required so flex-1 children can propagate a defined height down
    // to page content (enabling CSS-only viewport-fill layouts).
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay — tap outside the sidebar to close it */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={handleSidebarToggle}
          aria-hidden="true"
        />
      )}

      <AppSidebar
        collapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        activeMemberId={activeMemberId}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          title={title}
          description={description}
          right={topbarControls}
          mobileMenuButton={mobileMenuButton}
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
