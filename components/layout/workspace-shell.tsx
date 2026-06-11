import { ReactNode } from 'react'

interface WorkspaceShellProps {
  children: ReactNode
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV
  const showBanner = !appEnv || appEnv !== 'production'

  return (
    <div className="min-h-screen flex flex-col">
      {showBanner && (
        <div className="w-full bg-amber-400 text-black py-2 px-4 text-center font-medium">
          ⚠ Non-production environment — do not enter real financial data
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
