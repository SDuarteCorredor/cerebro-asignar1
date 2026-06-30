'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ShellContextValue {
  sidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
}

const ShellContext = createContext<ShellContextValue>({
  sidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
})

export function useShell() {
  return useContext(ShellContext)
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <ShellContext value={{ sidebarOpen, openSidebar, closeSidebar }}>
      <div className="app-shell">
        {children}
      </div>
    </ShellContext>
  )
}
