import type { ReactNode } from "react";
import WorkspaceShellClient from "@/components/layout/workspace-shell-client";
import type { WorkspaceLeftPanelSection } from "@/components/layout/workspace-left-panel";

type WorkspaceShellProps = {
  title: string;
  description: string;
  topbarControls?: ReactNode;
  leftPanelSections: WorkspaceLeftPanelSection[];
  children: ReactNode;
  // Member context — passed from each page so sidebar can preserve ?member= in nav links
  isAdmin?: boolean;
  currentUserId?: string;
  activeMemberId?: string;
};

export default function WorkspaceShell({
  title,
  description,
  topbarControls,
  leftPanelSections,
  children,
  isAdmin = false,
  currentUserId = "",
  activeMemberId = "",
}: WorkspaceShellProps) {
  return (
    <WorkspaceShellClient
      title={title}
      description={description}
      topbarControls={topbarControls}
      leftPanelSections={leftPanelSections}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      activeMemberId={activeMemberId}
    >
      {children}
    </WorkspaceShellClient>
  );
}
