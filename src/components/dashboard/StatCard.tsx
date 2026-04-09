import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accentColor?: 'green' | 'red' | 'blue' | 'yellow' | 'zinc'
}

const accentMap = {
  green: 'text-green-400 bg-green-950',
  red: 'text-red-400 bg-red-950',
  blue: 'text-blue-400 bg-blue-950',
  yellow: 'text-yellow-400 bg-yellow-950',
  zinc: 'text-zinc-400 bg-zinc-800',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'zinc',
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-zinc-100">{value}</p>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <div className={cn('rounded-lg p-2.5', accentMap[accentColor])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
