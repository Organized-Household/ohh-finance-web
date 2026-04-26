import type { ReactNode } from "react";
import WorkspaceShellClient from "@/components/layout/workspace-shell-client";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";

type WorkspaceShellProps = {
  title: string;
  description: string;
  topbarControls?: ReactNode;
  leftPanelSections: WorkspaceLeftPanelSection[];
  children: ReactNode;
};

// Server component — fetches member selector data here so the sidebar
// receives real member data on every page without per-page wiring.
export default function WorkspaceShell({
  title,
  description,
  topbarControls,
  leftPanelSections,
  children,
}: WorkspaceShellProps) {
  return (
    <WorkspaceShellClient
      title={title}
      description={description}
      topbarControls={topbarControls}
      leftPanelSections={leftPanelSections}
    >
      {children}
    </WorkspaceShellClient>
  );
}
