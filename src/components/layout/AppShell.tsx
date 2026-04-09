'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-h-screen md:ml-64">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-zinc-800 px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100">
            <span className="text-xs font-black text-zinc-900">DJA</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100">DJA Sneakers</span>
        </div>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <div className="p-4 pb-24 sm:p-6 md:p-8 md:pb-8">{children}</div>
      </main>
    </div>
  )
}
