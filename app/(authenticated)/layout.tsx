import { WorkspaceShell } from '@/components/layout/workspace-shell'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
