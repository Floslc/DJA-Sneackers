import type { PairStatus } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: PairStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  )
}
