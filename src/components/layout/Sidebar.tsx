'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  Truck,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/whatnot', label: 'Whatnot', icon: Tag },
  { href: '/shipping', label: 'Expéditions', icon: Truck },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100">
          <span className="text-sm font-black text-zinc-900">DJA</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100 leading-none">DJA</p>
          <p className="text-xs text-zinc-500 mt-0.5">Sneakers</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-6 py-4">
        <p className="text-xs text-zinc-600">DJA Sneakers v0.1</p>
      </div>
    </aside>
  )
}
